#!/usr/bin/env python3
"""
Content Generation Tools
AI-powered content generation and analysis tools.
"""

import logging
from typing import Any, Dict, List, Optional

from .models import AIModelManager

logger = logging.getLogger(__name__)


class ContentGenerator:
    """Content generation and analysis tools."""

    def __init__(self):
        self.ai_manager = AIModelManager()

    async def generate_content(self, content_type: str, topic: str, length: str = "medium",
                             style: str = "professional", keywords: List[str] = None,
                             model: str = "openai") -> Dict[str, Any]:
        """Generate various types of content using AI."""
        try:
            prompt = self._build_content_prompt(content_type, topic, length, style, keywords or [])

            result = await self.ai_manager.generate_content(prompt, model)

            return {
                "content": result["content"],
                "content_type": content_type,
                "topic": topic,
                "model_used": model,
                "word_count": len(result["content"].split()),
                "metadata": {
                    "length": length,
                    "style": style,
                    "keywords": keywords or []
                }
            }

        except Exception as e:
            logger.error(f"Content generation failed: {e}")
            return {"error": str(e), "content_type": content_type, "topic": topic}

    def _build_content_prompt(self, content_type: str, topic: str, length: str,
                            style: str, keywords: List[str]) -> str:
        """Build appropriate prompt for content generation."""
        base_prompt = f"Write a {length} {content_type} about {topic} in a {style} style."

        if keywords:
            keywords_str = ", ".join(keywords)
            base_prompt += f" Include these keywords: {keywords_str}."

        # Content type specific instructions
        if content_type.lower() == "blog post":
            base_prompt += " Make it engaging and SEO-friendly with proper headings."
        elif content_type.lower() == "article":
            base_prompt += " Make it informative and well-structured."
        elif content_type.lower() == "social media post":
            base_prompt += " Keep it concise and engaging for social media."
        elif content_type.lower() == "email":
            base_prompt += " Make it professional and persuasive."
        elif content_type.lower() == "product description":
            base_prompt += " Focus on benefits and features."
        elif content_type.lower() == "tutorial":
            base_prompt += " Make it step-by-step and easy to follow."

        # Length specific instructions
        if length.lower() == "short":
            base_prompt += " Keep it under 200 words."
        elif length.lower() == "medium":
            base_prompt += " Aim for 300-500 words."
        elif length.lower() == "long":
            base_prompt += " Make it comprehensive, over 800 words."

        return base_prompt

    async def analyze_content(self, content: str, analysis_type: str = "general") -> Dict[str, Any]:
        """Analyze content for various metrics."""
        try:
            if analysis_type == "seo":
                return await self._analyze_seo(content)
            elif analysis_type == "readability":
                return self._analyze_readability(content)
            elif analysis_type == "sentiment":
                return await self._analyze_sentiment(content)
            else:
                return self._analyze_general(content)

        except Exception as e:
            logger.error(f"Content analysis failed: {e}")
            return {"error": str(e), "analysis_type": analysis_type}

    async def _analyze_seo(self, content: str) -> Dict[str, Any]:
        """Analyze content for SEO."""
        prompt = f"""Analyze this content for SEO optimization:

{content}

Provide:
1. SEO score (0-100)
2. Keyword density analysis
3. Readability score
4. Suggestions for improvement

Format as JSON."""

        try:
            result = await self.ai_manager.generate_content(prompt, model="openai")
            return {
                "seo_analysis": result["content"],
                "word_count": len(content.split()),
                "character_count": len(content)
            }
        except:
            # Fallback to basic analysis
            return self._basic_seo_analysis(content)

    def _basic_seo_analysis(self, content: str) -> Dict[str, Any]:
        """Basic SEO analysis without AI."""
        words = content.split()
        sentences = content.split('.')

        return {
            "word_count": len(words),
            "sentence_count": len(sentences),
            "avg_words_per_sentence": len(words) / max(len(sentences), 1),
            "character_count": len(content),
            "basic_seo_score": min(100, len(words) // 10)  # Simple scoring
        }

    def _analyze_readability(self, content: str) -> Dict[str, Any]:
        """Analyze content readability."""
        words = content.split()
        sentences = [s.strip() for s in content.split('.') if s.strip()]

        if not words or not sentences:
            return {"error": "Content too short for analysis"}

        avg_words_per_sentence = len(words) / len(sentences)
        avg_syllables_per_word = sum(self._count_syllables(word) for word in words) / len(words)

        # Flesch Reading Ease Score
        flesch_score = 206.835 - (1.015 * avg_words_per_sentence) - (84.6 * avg_syllables_per_word)

        return {
            "flesch_reading_ease": round(flesch_score, 2),
            "readability_level": self._get_readability_level(flesch_score),
            "word_count": len(words),
            "sentence_count": len(sentences),
            "avg_words_per_sentence": round(avg_words_per_sentence, 2),
            "avg_syllables_per_word": round(avg_syllables_per_word, 2)
        }

    async def _analyze_sentiment(self, content: str) -> Dict[str, Any]:
        """Analyze content sentiment."""
        prompt = f"""Analyze the sentiment of this content:

{content}

Provide:
1. Overall sentiment (positive/negative/neutral)
2. Sentiment score (-1 to 1)
3. Key positive/negative phrases
4. Emotional tone

Format as JSON."""

        try:
            result = await self.ai_manager.generate_content(prompt, model="openai")
            return {
                "sentiment_analysis": result["content"],
                "content_length": len(content)
            }
        except:
            return {"error": "Sentiment analysis requires AI model configuration"}

    def _analyze_general(self, content: str) -> Dict[str, Any]:
        """General content analysis."""
        words = content.split()
        sentences = [s.strip() for s in content.split('.') if s.strip()]
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]

        return {
            "word_count": len(words),
            "sentence_count": len(sentences),
            "paragraph_count": len(paragraphs),
            "character_count": len(content),
            "avg_words_per_sentence": len(words) / max(len(sentences), 1),
            "avg_sentences_per_paragraph": len(sentences) / max(len(paragraphs), 1)
        }

    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word."""
        word = word.lower()
        count = 0
        vowels = "aeiouy"

        if word[0] in vowels:
            count += 1

        for i in range(1, len(word)):
            if word[i] in vowels and word[i - 1] not in vowels:
                count += 1

        if word.endswith("e"):
            count -= 1

        if count == 0:
            count += 1

        return count

    def _get_readability_level(self, score: float) -> str:
        """Get readability level description."""
        if score >= 90:
            return "Very Easy"
        elif score >= 80:
            return "Easy"
        elif score >= 70:
            return "Fairly Easy"
        elif score >= 60:
            return "Standard"
        elif score >= 50:
            return "Fairly Difficult"
        elif score >= 30:
            return "Difficult"
        else:
            return "Very Difficult"
