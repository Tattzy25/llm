#!/usr/bin/env python3
"""
Weather MCP Server
Provides weather information through OpenWeatherMap API
"""

import asyncio
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional
import aiohttp
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource,  # pyright: ignore[reportUnusedImport]
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel
)
from pydantic import AnyUrl

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("weather-server")

class WeatherServer:
    def __init__(self):
        self.server = Server("weather-server")
        self.api_key = os.getenv('OPENWEATHERMAP_API_KEY')
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.session: Optional[aiohttp.ClientSession] = None
        
        if not self.api_key:
            logger.error("OPENWEATHERMAP_API_KEY environment variable is required")
            sys.exit(1)
        
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.server.list_tools()
        async def handle_list_tools() -> List[Tool]:
            return [
                Tool(
                    name="get_weather",
                    description="Get current weather for a city",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "city": {
                                "type": "string",
                                "description": "City name"
                            },
                            "country": {
                                "type": "string",
                                "description": "Country code (optional)",
                                "default": "US"
                            },
                            "units": {
                                "type": "string",
                                "enum": ["metric", "imperial", "kelvin"],
                                "description": "Temperature units",
                                "default": "metric"
                            }
                        },
                        "required": ["city"]
                    }
                ),
                Tool(
                    name="get_forecast",
                    description="Get weather forecast for a city",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "city": {
                                "type": "string",
                                "description": "City name"
                            },
                            "country": {
                                "type": "string",
                                "description": "Country code (optional)",
                                "default": "US"
                            },
                            "days": {
                                "type": "integer",
                                "description": "Number of days (1-5)",
                                "minimum": 1,
                                "maximum": 5,
                                "default": 3
                            },
                            "units": {
                                "type": "string",
                                "enum": ["metric", "imperial", "kelvin"],
                                "description": "Temperature units",
                                "default": "metric"
                            }
                        },
                        "required": ["city"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            if name == "get_weather":
                return await self.get_weather(arguments)
            elif name == "get_forecast":
                return await self.get_forecast(arguments)
            else:
                raise ValueError(f"Unknown tool: {name}")
    
    async def get_session(self) -> aiohttp.ClientSession:
        if not self.session:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=10)
            )
        return self.session
    
    async def get_weather(self, arguments: Dict[str, Any]) -> List[TextContent]:
        city = arguments.get("city")
        country = arguments.get("country", "")
        units = arguments.get("units", "metric")
        
        location = f"{city},{country}" if country else city
        
        params = {
            "q": location,
            "appid": self.api_key,
            "units": units
        }
        
        session = await self.get_session()
        
        try:
            async with session.get(f"{self.base_url}/weather", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    temp_unit = "°C" if units == "metric" else "°F" if units == "imperial" else "K"
                    speed_unit = "m/s" if units == "metric" else "mph" if units == "imperial" else "m/s"
                    
                    weather_text = f"""Weather in {data['name']}, {data['sys']['country']}:
🌡️ Temperature: {data['main']['temp']:.1f}{temp_unit} (feels like {data['main']['feels_like']:.1f}{temp_unit})
☁️ Condition: {data['weather'][0]['description'].title()}
💧 Humidity: {data['main']['humidity']}%
🌬️ Wind: {data['wind']['speed']} {speed_unit}
📊 Pressure: {data['main']['pressure']} hPa
👁️ Visibility: {data.get('visibility', 0) / 1000:.1f} km"""
                    
                    return [TextContent(type="text", text=weather_text)]
                elif response.status == 401:
                    return [TextContent(type="text", text="Error: Invalid API key")]
                elif response.status == 404:
                    return [TextContent(type="text", text=f"Error: City '{city}' not found")]
                else:
                    return [TextContent(type="text", text=f"Error: API returned status {response.status}")]
        except Exception as e:
            logger.error(f"Error fetching weather: {e}")
            return [TextContent(type="text", text=f"Error fetching weather data: {str(e)}")]
    
    async def get_forecast(self, arguments: Dict[str, Any]) -> List[TextContent]:
        city = arguments.get("city")
        country = arguments.get("country", "")
        days = min(arguments.get("days", 3), 5)
        units = arguments.get("units", "metric")
        
        location = f"{city},{country}" if country else city
        
        params = {
            "q": location,
            "appid": self.api_key,
            "units": units,
            "cnt": days * 8  # 8 forecasts per day (3-hour intervals)
        }
        
        session = await self.get_session()
        
        try:
            async with session.get(f"{self.base_url}/forecast", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    temp_unit = "°C" if units == "metric" else "°F" if units == "imperial" else "K"
                    
                    forecast_text = f"Weather Forecast for {data['city']['name']}, {data['city']['country']}:\n\n"
                    
                    # Group by day
                    from datetime import datetime
                    daily_data = {}
                    
                    for item in data['list'][:days * 8]:
                        date = datetime.fromtimestamp(item['dt']).date()
                        if date not in daily_data:
                            daily_data[date] = []
                        daily_data[date].append(item)
                    
                    for i, (date, forecasts) in enumerate(list(daily_data.items())[:days]):
                        day_name = "Today" if i == 0 else "Tomorrow" if i == 1 else date.strftime("%A")
                        
                        # Use midday forecast
                        midday = None
                        for f in forecasts:
                            hour = datetime.fromtimestamp(f['dt']).hour
                            if 11 <= hour <= 14:
                                midday = f
                                break
                        
                        if not midday:
                            midday = forecasts[len(forecasts)//2]
                        
                        forecast_text += f"📅 {day_name} ({date.strftime('%m/%d')}):\n"
                        forecast_text += f"   🌡️ {midday['main']['temp']:.1f}{temp_unit} - {midday['weather'][0]['description'].title()}\n"
                        forecast_text += f"   💧 Humidity: {midday['main']['humidity']}%\n\n"
                    
                    return [TextContent(type="text", text=forecast_text)]
                elif response.status == 401:
                    return [TextContent(type="text", text="Error: Invalid API key")]
                elif response.status == 404:
                    return [TextContent(type="text", text=f"Error: City '{city}' not found")]
                else:
                    return [TextContent(type="text", text=f"Error: API returned status {response.status}")]
        except Exception as e:
            logger.error(f"Error fetching forecast: {e}")
            return [TextContent(type="text", text=f"Error fetching forecast data: {str(e)}")]
    
    async def cleanup(self):
        if self.session:
            await self.session.close()

async def main():
    weather_server = WeatherServer()
    
    # Run the server using stdio transport
    async with stdio_server() as (read_stream, write_stream):
        await weather_server.server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="weather-server",
                server_version="1.0.0",
                capabilities=weather_server.server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )
    
    await weather_server.cleanup()

if __name__ == "__main__":
    asyncio.run(main())