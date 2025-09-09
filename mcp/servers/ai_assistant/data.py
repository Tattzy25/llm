#!/usr/bin/env python3
"""
Data Analysis Tools
Tools for data processing, analysis, and visualization.
"""

import logging
import json
from typing import Any, Dict, List, Optional, Union
import statistics
from collections import Counter

logger = logging.getLogger(__name__)


class DataAnalyzer:
    """Data analysis and processing tools."""

    def __init__(self):
        pass

    def analyze_data(self, data: Union[str, Dict, List], data_type: str = "auto") -> Dict[str, Any]:
        """Analyze data and provide insights."""
        try:
            if isinstance(data, str):
                try:
                    parsed_data = json.loads(data)
                except json.JSONDecodeError:
                    return self._analyze_text_data(data)
            else:
                parsed_data = data

            if data_type == "auto":
                data_type = self._infer_data_type(parsed_data)

            if data_type == "list":
                return self._analyze_list_data(parsed_data)
            elif data_type == "dict":
                return self._analyze_dict_data(parsed_data)
            elif data_type == "numeric":
                return self._analyze_numeric_data(parsed_data)
            else:
                return self._analyze_general_data(parsed_data)

        except Exception as e:
            logger.error(f"Data analysis failed: {e}")
            return {"error": str(e), "data_type": data_type}

    def _infer_data_type(self, data: Any) -> str:
        """Infer the type of data."""
        if isinstance(data, list):
            return "list"
        elif isinstance(data, dict):
            return "dict"
        elif isinstance(data, (int, float)):
            return "numeric"
        else:
            return "general"

    def _analyze_text_data(self, text: str) -> Dict[str, Any]:
        """Analyze text data."""
        words = text.split()
        sentences = text.split('.')

        return {
            "type": "text",
            "word_count": len(words),
            "sentence_count": len(sentences),
            "character_count": len(text),
            "average_word_length": sum(len(word) for word in words) / len(words) if words else 0,
            "unique_words": len(set(words)),
            "most_common_words": Counter(words).most_common(5)
        }

    def _analyze_list_data(self, data: List) -> Dict[str, Any]:
        """Analyze list data."""
        if not data:
            return {"type": "list", "length": 0, "elements": []}

        # Check if all elements are numeric
        try:
            numeric_data = [float(x) for x in data]
            return self._analyze_numeric_list(numeric_data)
        except (ValueError, TypeError):
            pass

        # Analyze as general list
        element_types = [type(x).__name__ for x in data]
        type_counts = Counter(element_types)

        return {
            "type": "list",
            "length": len(data),
            "element_types": dict(type_counts),
            "unique_elements": len(set(str(x) for x in data)),
            "sample_elements": data[:5] if len(data) > 5 else data
        }

    def _analyze_numeric_list(self, data: List[float]) -> Dict[str, Any]:
        """Analyze numeric list data."""
        if not data:
            return {"type": "numeric_list", "length": 0}

        try:
            return {
                "type": "numeric_list",
                "length": len(data),
                "sum": sum(data),
                "mean": statistics.mean(data),
                "median": statistics.median(data),
                "mode": statistics.mode(data) if len(set(data)) < len(data) else None,
                "min": min(data),
                "max": max(data),
                "range": max(data) - min(data),
                "variance": statistics.variance(data) if len(data) > 1 else 0,
                "stdev": statistics.stdev(data) if len(data) > 1 else 0,
                "quartiles": {
                    "q1": statistics.quantiles(data, n=4)[0] if len(data) >= 4 else None,
                    "q2": statistics.quantiles(data, n=4)[1] if len(data) >= 4 else None,
                    "q3": statistics.quantiles(data, n=4)[2] if len(data) >= 4 else None
                }
            }
        except Exception as e:
            return {"type": "numeric_list", "error": str(e), "length": len(data)}

    def _analyze_dict_data(self, data: Dict) -> Dict[str, Any]:
        """Analyze dictionary data."""
        keys = list(data.keys())
        values = list(data.values())

        return {
            "type": "dict",
            "key_count": len(keys),
            "keys": keys,
            "value_types": [type(v).__name__ for v in values],
            "nested_structures": sum(1 for v in values if isinstance(v, (dict, list))),
            "sample_values": {k: v for k, v in list(data.items())[:5]}
        }

    def _analyze_numeric_data(self, data: Union[int, float]) -> Dict[str, Any]:
        """Analyze single numeric data."""
        return {
            "type": "numeric",
            "value": data,
            "is_integer": isinstance(data, int),
            "is_float": isinstance(data, float),
            "sign": "positive" if data > 0 else "negative" if data < 0 else "zero"
        }

    def _analyze_general_data(self, data: Any) -> Dict[str, Any]:
        """Analyze general data."""
        return {
            "type": "general",
            "data_type": type(data).__name__,
            "string_representation": str(data),
            "length": len(str(data)) if hasattr(data, '__len__') else None
        }

    def generate_visualization_data(self, data: Union[List, Dict], chart_type: str = "auto") -> Dict[str, Any]:
        """Generate data for visualization."""
        try:
            if isinstance(data, list):
                if chart_type == "auto":
                    chart_type = "bar" if len(data) <= 20 else "line"

                if chart_type == "bar":
                    return self._generate_bar_chart_data(data)
                elif chart_type == "line":
                    return self._generate_line_chart_data(data)
                elif chart_type == "pie":
                    return self._generate_pie_chart_data(data)

            elif isinstance(data, dict):
                if chart_type == "auto":
                    chart_type = "bar"

                return self._generate_dict_chart_data(data, chart_type)

            return {"error": "Unsupported data type for visualization"}

        except Exception as e:
            return {"error": str(e)}

    def _generate_bar_chart_data(self, data: List) -> Dict[str, Any]:
        """Generate bar chart data."""
        try:
            # Try to convert to numeric
            numeric_data = [float(x) for x in data]
            labels = [f"Item {i+1}" for i in range(len(data))]

            return {
                "type": "bar",
                "labels": labels,
                "datasets": [{
                    "label": "Values",
                    "data": numeric_data,
                    "backgroundColor": "rgba(75, 192, 192, 0.6)",
                    "borderColor": "rgba(75, 192, 192, 1)",
                    "borderWidth": 1
                }]
            }
        except:
            # Categorical data
            counts = Counter(data)
            return {
                "type": "bar",
                "labels": list(counts.keys()),
                "datasets": [{
                    "label": "Count",
                    "data": list(counts.values()),
                    "backgroundColor": "rgba(255, 99, 132, 0.6)",
                    "borderColor": "rgba(255, 99, 132, 1)",
                    "borderWidth": 1
                }]
            }

    def _generate_line_chart_data(self, data: List) -> Dict[str, Any]:
        """Generate line chart data."""
        try:
            numeric_data = [float(x) for x in data]
            labels = [f"Point {i+1}" for i in range(len(data))]

            return {
                "type": "line",
                "labels": labels,
                "datasets": [{
                    "label": "Values",
                    "data": numeric_data,
                    "fill": False,
                    "borderColor": "rgba(75, 192, 192, 1)",
                    "tension": 0.1
                }]
            }
        except:
            return {"error": "Line chart requires numeric data"}

    def _generate_pie_chart_data(self, data: List) -> Dict[str, Any]:
        """Generate pie chart data."""
        counts = Counter(data)
        return {
            "type": "pie",
            "labels": list(counts.keys()),
            "datasets": [{
                "data": list(counts.values()),
                "backgroundColor": [
                    "rgba(255, 99, 132, 0.6)",
                    "rgba(54, 162, 235, 0.6)",
                    "rgba(255, 205, 86, 0.6)",
                    "rgba(75, 192, 192, 0.6)",
                    "rgba(153, 102, 255, 0.6)"
                ]
            }]
        }

    def _generate_dict_chart_data(self, data: Dict, chart_type: str) -> Dict[str, Any]:
        """Generate chart data from dictionary."""
        try:
            numeric_values = [float(v) for v in data.values()]
            return {
                "type": chart_type,
                "labels": list(data.keys()),
                "datasets": [{
                    "label": "Values",
                    "data": numeric_values,
                    "backgroundColor": "rgba(75, 192, 192, 0.6)",
                    "borderColor": "rgba(75, 192, 192, 1)",
                    "borderWidth": 1
                }]
            }
        except:
            return {"error": "Dictionary values must be numeric for charting"}
