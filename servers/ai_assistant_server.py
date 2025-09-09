#!/usr/bin/env python3
"""
Advanced AI Assistant MCP Server
Provides AI-powered tools for content generation, analysis, code assistance, and automation.
"""

import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional, Union
import os

import openai
import anthropic
import google.generativeai as genai
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from mcp.server import FastMCP
import requests
from bs4 import BeautifulSoup
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIAssistant:
    """Advanced AI assistant with multiple AI model integrations."""

    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        self.google_client = None
        self._setup_clients()

    def _setup_clients(self):
        """Setup AI model clients from environment variables."""
        # OpenAI
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if openai_api_key:
            self.openai_client = openai.OpenAI(api_key=openai_api_key)

        # Anthropic
        anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_api_key:
            self.anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)

        # Google Gemini
        google_api_key = os.getenv('GOOGLE_API_KEY')
        if google_api_key:
            genai.configure(api_key=google_api_key)
            self.google_client = genai.GenerativeModel('gemini-pro')

    async def generate_content(self, content_type: str, topic: str, length: str = "medium",
                             style: str = "professional", keywords: List[str] = None,
                             model: str = "openai") -> Dict[str, Any]:
        """Generate various types of content using AI."""
        try:
            prompt = self._build_content_prompt(content_type, topic, length, style, keywords)

            if model == "openai" and self.openai_client:
                return await self._generate_openai(prompt, content_type)
            elif model == "anthropic" and self.anthropic_client:
                return await self._generate_anthropic(prompt, content_type)
            elif model == "google" and self.google_client:
                return await self._generate_google(prompt, content_type)
            else:
                return {'error': f'Model {model} not available or not configured'}

        except Exception as e:
            logger.error(f"Content generation failed: {str(e)}")
            return {'error': str(e), 'content_type': content_type, 'topic': topic}

    def _build_content_prompt(self, content_type: str, topic: str, length: str,
                            style: str, keywords: List[str]) -> str:
        """Build appropriate prompt for content generation."""
        length_guide = {
            "short": "200-300 words",
            "medium": "400-600 words",
            "long": "800-1200 words"
        }

        base_prompts = {
            "article": f"Write a {length} {style} article about {topic}.",
            "summary": f"Create a {length} {style} summary of {topic}.",
            "code": f"Write {style} code for {topic}. Include comments and documentation.",
            "email": f"Compose a {style} email about {topic}.",
            "social": f"Create {style} social media content about {topic}.",
            "creative": f"Write a {style} creative piece about {topic}."
        }

        prompt = base_prompts.get(content_type, f"Create {style} content about {topic}")
        prompt += f"\n\nTarget length: {length_guide.get(length, 'medium')}"

        if keywords:
            prompt += f"\n\nInclude these keywords: {', '.join(keywords)}"

        prompt += f"\n\nStyle: {style}"
        prompt += "\n\nEnsure the content is well-structured, engaging, and informative."

        return prompt

    async def _generate_openai(self, prompt: str, content_type: str) -> Dict[str, Any]:
        """Generate content using OpenAI."""
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0.7
            )

            content = response.choices[0].message.content

            return {
                'success': True,
                'content': content,
                'model': 'gpt-4',
                'tokens_used': response.usage.total_tokens if response.usage else None,
                'content_type': content_type
            }

        except Exception as e:
            return {'error': f'OpenAI generation failed: {str(e)}'}

    async def _generate_anthropic(self, prompt: str, content_type: str) -> Dict[str, Any]:
        """Generate content using Anthropic."""
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            return {
                'success': True,
                'content': response.content[0].text,
                'model': 'claude-3-sonnet',
                'content_type': content_type
            }

        except Exception as e:
            return {'error': f'Anthropic generation failed: {str(e)}'}

    async def _generate_google(self, prompt: str, content_type: str) -> Dict[str, Any]:
        """Generate content using Google Gemini."""
        try:
            response = self.google_client.generate_content(prompt)

            return {
                'success': True,
                'content': response.text,
                'model': 'gemini-pro',
                'content_type': content_type
            }

        except Exception as e:
            return {'error': f'Google generation failed: {str(e)}'}

    async def analyze_code(self, code: str, language: str, analysis_type: str = "bugs") -> Dict[str, Any]:
        """Analyze code for various issues and improvements."""
        try:
            prompt = self._build_code_analysis_prompt(code, language, analysis_type)

            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000,
                    temperature=0.3
                )

                analysis = response.choices[0].message.content

                return {
                    'success': True,
                    'analysis': analysis,
                    'language': language,
                    'analysis_type': analysis_type,
                    'issues_found': self._extract_issues(analysis)
                }
            else:
                return {'error': 'OpenAI client not configured for code analysis'}

        except Exception as e:
            logger.error(f"Code analysis failed: {str(e)}")
            return {'error': str(e), 'language': language, 'analysis_type': analysis_type}

    def _build_code_analysis_prompt(self, code: str, language: str, analysis_type: str) -> str:
        """Build prompt for code analysis."""
        prompts = {
            "bugs": f"Analyze this {language} code for potential bugs, errors, and logical issues:\n\n{code}",
            "performance": f"Analyze this {language} code for performance issues and optimization opportunities:\n\n{code}",
            "security": f"Analyze this {language} code for security vulnerabilities and best practices:\n\n{code}",
            "style": f"Analyze this {language} code for style issues and adherence to {language} conventions:\n\n{code}",
            "complexity": f"Analyze this {language} code for complexity issues and suggest simplifications:\n\n{code}"
        }

        return prompts.get(analysis_type, f"Analyze this {language} code:\n\n{code}")

    def _extract_issues(self, analysis: str) -> List[Dict[str, str]]:
        """Extract issues from analysis text."""
        issues = []
        lines = analysis.split('\n')

        for line in lines:
            if any(keyword in line.lower() for keyword in ['error', 'bug', 'issue', 'problem', 'warning']):
                issues.append({
                    'type': 'issue',
                    'description': line.strip(),
                    'severity': 'medium'
                })

        return issues

    async def analyze_data(self, data: str, data_type: str, analysis_type: str,
                          columns: List[str] = None) -> Dict[str, Any]:
        """Analyze datasets and generate insights."""
        try:
            if data_type == "json":
                df = pd.read_json(data)
            elif data_type == "csv":
                df = pd.read_csv(data)
            else:
                return {'error': f'Unsupported data type: {data_type}'}

            result = {
                'data_type': data_type,
                'analysis_type': analysis_type,
                'shape': df.shape,
                'columns': list(df.columns)
            }

            if analysis_type == "summary":
                result['summary'] = self._generate_data_summary(df)
            elif analysis_type == "trends":
                result['trends'] = self._analyze_trends(df, columns)
            elif analysis_type == "correlations":
                result['correlations'] = self._analyze_correlations(df, columns)
            elif analysis_type == "anomalies":
                result['anomalies'] = self._detect_anomalies(df, columns)
            elif analysis_type == "predictions":
                result['predictions'] = self._generate_predictions(df, columns)

            return result

        except Exception as e:
            logger.error(f"Data analysis failed: {str(e)}")
            return {'error': str(e), 'data_type': data_type, 'analysis_type': analysis_type}

    def _generate_data_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive data summary."""
        return {
            'info': df.info(),
            'describe': df.describe().to_dict(),
            'null_counts': df.isnull().sum().to_dict(),
            'data_types': df.dtypes.to_dict(),
            'unique_counts': df.nunique().to_dict()
        }

    def _analyze_trends(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Analyze trends in the data."""
        trends = {}

        if columns:
            for col in columns:
                if col in df.columns:
                    if df[col].dtype in ['int64', 'float64']:
                        trends[col] = {
                            'mean': df[col].mean(),
                            'median': df[col].median(),
                            'std': df[col].std(),
                            'min': df[col].min(),
                            'max': df[col].max()
                        }
                    else:
                        trends[col] = df[col].value_counts().head(10).to_dict()

        return trends

    def _analyze_correlations(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Analyze correlations between columns."""
        numeric_df = df.select_dtypes(include=[np.number])

        if columns:
            numeric_df = numeric_df[columns] if all(col in numeric_df.columns for col in columns) else numeric_df

        if not numeric_df.empty:
            correlation_matrix = numeric_df.corr()
            return {
                'correlation_matrix': correlation_matrix.to_dict(),
                'strong_correlations': self._find_strong_correlations(correlation_matrix)
            }
        else:
            return {'message': 'No numeric columns available for correlation analysis'}

    def _find_strong_correlations(self, corr_matrix: pd.DataFrame, threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Find strongly correlated column pairs."""
        strong_corr = []

        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_value = abs(corr_matrix.iloc[i, j])
                if corr_value > threshold:
                    strong_corr.append({
                        'column1': corr_matrix.columns[i],
                        'column2': corr_matrix.columns[j],
                        'correlation': corr_value
                    })

        return strong_corr

    def _detect_anomalies(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Detect anomalies in the data."""
        anomalies = {}

        if columns:
            for col in columns:
                if col in df.columns and df[col].dtype in ['int64', 'float64']:
                    mean = df[col].mean()
                    std = df[col].std()
                    threshold = 3 * std

                    outlier_mask = (df[col] - mean).abs() > threshold
                    anomalies[col] = {
                        'outlier_count': outlier_mask.sum(),
                        'outlier_percentage': (outlier_mask.sum() / len(df)) * 100,
                        'outlier_indices': df[outlier_mask].index.tolist()
                    }

        return anomalies

    def _generate_predictions(self, df: pd.DataFrame, columns: List[str]) -> Dict[str, Any]:
        """Generate simple predictions based on trends."""
        predictions = {}

        if columns:
            for col in columns:
                if col in df.columns and df[col].dtype in ['int64', 'float64']:
                    # Simple linear trend prediction
                    if len(df) > 1:
                        x = np.arange(len(df))
                        y = df[col].values
                        slope = np.polyfit(x, y, 1)[0]

                        predictions[col] = {
                            'trend_slope': slope,
                            'trend_direction': 'increasing' if slope > 0 else 'decreasing',
                            'next_value_prediction': y[-1] + slope
                        }

        return predictions

# MCP Server Implementation
app = FastMCP("ai-assistant-server")
fastapi_app = FastAPI(title="AI Assistant MCP Server")

ai_assistant = AIAssistant()

@app.tool()
async def content_generator(content_type: str, topic: str, length: str = "medium",
                          style: str = "professional", keywords: List[str] = None,
                          model: str = "openai") -> Dict[str, Any]:
    """
    Generate various types of content using AI models.

    Args:
        content_type: Type of content (article, summary, code, email, social, creative)
        topic: Topic or subject for content generation
        length: Desired content length (short, medium, long)
        style: Writing style or tone
        keywords: Keywords to include in content
        model: AI model to use (openai, anthropic, google)

    Returns:
        Generated content with metadata
    """
    return await ai_assistant.generate_content(content_type, topic, length, style, keywords, model)

@app.tool()
async def code_analyzer(code: str, language: str, analysis_type: str = "bugs") -> Dict[str, Any]:
    """
    Analyze code for bugs, performance, security, and best practices.

    Args:
        code: Code to analyze
        language: Programming language
        analysis_type: Type of analysis (bugs, performance, security, style, complexity)

    Returns:
        Code analysis results with issues and recommendations
    """
    return await ai_assistant.analyze_code(code, language, analysis_type)

@app.tool()
async def data_analyzer(data: str, data_type: str, analysis_type: str,
                       columns: List[str] = None) -> Dict[str, Any]:
    """
    Analyze datasets and generate insights.

    Args:
        data: JSON data or CSV content to analyze
        data_type: Format of input data (json, csv, text)
        analysis_type: Type of analysis (summary, trends, correlations, anomalies, predictions)
        columns: Specific columns to analyze

    Returns:
        Data analysis results with insights and metrics
    """
    return await ai_assistant.analyze_data(data, data_type, analysis_type, columns)

# Mount FastMCP app to FastAPI for WebSocket support
fastapi_app.mount("/mcp", app)

@fastapi_app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Handle MCP protocol over WebSocket
        await app.run_websocket(websocket)
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(fastapi_app, host="digitalhustlelab.com", port=3004)
