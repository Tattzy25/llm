#!/usr/bin/env python3
"""
MCP AI Tools
============

AI-related tools for MCP servers.
Provides content generation, analysis, and AI utilities.
"""

import re
import json
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from ..core import MCPValidationError


class MCPAITools:
    """Basic AI tools for MCP servers."""

    @staticmethod
    def analyze_text(text: str) -> Dict[str, Any]:
        """Perform basic text analysis."""
        try:
            words = text.split()
            sentences = re.split(r'[.!?]+', text)

            # Word frequency analysis
            word_freq = {}
            for word in words:
                clean_word = re.sub(r'[^\w]', '', word.lower())
                if clean_word:
                    word_freq[clean_word] = word_freq.get(clean_word, 0) + 1

            # Basic readability metrics
            avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
            avg_sentence_length = len(words) / len(sentences) if sentences else 0

            return {
                "word_count": len(words),
                "sentence_count": len(sentences),
                "character_count": len(text),
                "character_count_no_spaces": len(text.replace(" ", "")),
                "average_word_length": round(avg_word_length, 2),
                "average_sentence_length": round(avg_sentence_length, 2),
                "most_common_words": sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10],
                "unique_words": len(word_freq),
                "lexical_density": len(word_freq) / len(words) if words else 0
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to analyze text: {str(e)}")

    @staticmethod
    def extract_keywords(text: str, max_keywords: int = 10) -> List[Dict[str, Any]]:
        """Extract keywords from text using basic frequency analysis."""
        try:
            words = re.findall(r'\b\w+\b', text.lower())

            # Remove common stop words
            stop_words = {
                'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
                'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
                'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'
            }

            filtered_words = [word for word in words if word not in stop_words and len(word) > 2]

            # Calculate word frequencies
            word_freq = {}
            for word in filtered_words:
                word_freq[word] = word_freq.get(word, 0) + 1

            # Calculate TF-IDF-like scores (simplified)
            keywords = []
            total_words = len(filtered_words)

            for word, freq in word_freq.items():
                tf = freq / total_words
                # Simple IDF approximation (rarer words get higher scores)
                idf = 1 / (freq / total_words + 0.01)
                score = tf * idf

                keywords.append({
                    "keyword": word,
                    "frequency": freq,
                    "score": round(score, 4)
                })

            # Sort by score and return top keywords
            keywords.sort(key=lambda x: x["score"], reverse=True)
            return keywords[:max_keywords]
        except Exception as e:
            raise MCPValidationError(f"Failed to extract keywords: {str(e)}")

    @staticmethod
    def summarize_text(text: str, max_sentences: int = 3) -> Dict[str, Any]:
        """Create a basic text summary using sentence scoring."""
        try:
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if s.strip()]

            if not sentences:
                return {"summary": "", "original_sentences": 0}

            # Score sentences based on word frequency
            words = re.findall(r'\b\w+\b', text.lower())
            word_freq = {}
            for word in words:
                if len(word) > 2:
                    word_freq[word] = word_freq.get(word, 0) + 1

            # Score each sentence
            sentence_scores = []
            for i, sentence in enumerate(sentences):
                sentence_words = re.findall(r'\b\w+\b', sentence.lower())
                score = sum(word_freq.get(word, 0) for word in sentence_words)
                sentence_scores.append((i, score))

            # Select top sentences
            sentence_scores.sort(key=lambda x: x[1], reverse=True)
            selected_indices = sorted([idx for idx, _ in sentence_scores[:max_sentences]])

            summary_sentences = [sentences[i] for i in selected_indices]
            summary = '. '.join(summary_sentences)

            if summary and not summary.endswith('.'):
                summary += '.'

            return {
                "summary": summary,
                "original_sentences": len(sentences),
                "summary_sentences": len(summary_sentences),
                "compression_ratio": len(summary_sentences) / len(sentences) if sentences else 0
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to summarize text: {str(e)}")


class MCPContentTools:
    """Content generation and processing tools."""

    @staticmethod
    def generate_title(text: str, max_length: int = 60) -> Dict[str, Any]:
        """Generate a title for the given text."""
        try:
            # Extract first sentence or key phrases
            sentences = re.split(r'[.!?]+', text)
            first_sentence = sentences[0].strip() if sentences else ""

            # Extract keywords
            keywords = MCPAITools.extract_keywords(text, max_keywords=5)
            keyword_text = " ".join([kw["keyword"] for kw in keywords])

            # Generate title options
            titles = []

            # Option 1: First sentence truncated
            if len(first_sentence) <= max_length:
                titles.append(first_sentence)
            else:
                truncated = first_sentence[:max_length-3] + "..."
                titles.append(truncated)

            # Option 2: Keywords-based title
            if len(keyword_text) <= max_length:
                titles.append(keyword_text.title())
            else:
                words = keyword_text.split()
                title_words = []
                current_length = 0
                for word in words:
                    if current_length + len(word) + 1 <= max_length:
                        title_words.append(word)
                        current_length += len(word) + 1
                    else:
                        break
                titles.append(" ".join(title_words).title())

            return {
                "titles": titles,
                "best_title": titles[0] if titles else "",
                "keyword_based": titles[1] if len(titles) > 1 else "",
                "max_length": max_length
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to generate title: {str(e)}")

    @staticmethod
    def extract_entities(text: str) -> Dict[str, List[str]]:
        """Extract named entities from text using pattern matching."""
        try:
            entities = {
                "emails": re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text),
                "urls": re.findall(r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:\w*))*)?', text),
                "phone_numbers": re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text),
                "dates": re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text),
                "times": re.findall(r'\b\d{1,2}:\d{2}(?:\s?[AP]M)?\b', text),
                "money": re.findall(r'\$\d+(?:\.\d{2})?', text),
                "percentages": re.findall(r'\b\d+(?:\.\d+)?%\b', text)
            }

            # Extract capitalized words (potential proper nouns)
            words = re.findall(r'\b[A-Z][a-z]+\b', text)
            entities["proper_nouns"] = list(set(words))

            return entities
        except Exception as e:
            raise MCPValidationError(f"Failed to extract entities: {str(e)}")

    @staticmethod
    def format_content(text: str, format_type: str = "markdown") -> str:
        """Format text content in different formats."""
        try:
            if format_type == "markdown":
                # Basic markdown formatting
                lines = text.split('\n')
                formatted_lines = []

                for line in lines:
                    # Convert headers
                    if line.startswith('#'):
                        formatted_lines.append(line)
                    elif len(line.strip()) == 0:
                        formatted_lines.append('')
                    elif line.startswith('- ') or line.startswith('* '):
                        formatted_lines.append(line)
                    elif re.match(r'^\d+\.', line):
                        formatted_lines.append(line)
                    else:
                        # Regular paragraph
                        formatted_lines.append(line)

                return '\n'.join(formatted_lines)

            elif format_type == "html":
                # Basic HTML formatting
                lines = text.split('\n')
                formatted_lines = []

                for line in lines:
                    if line.startswith('#'):
                        level = len(line) - len(line.lstrip('#'))
                        content = line.lstrip('#').strip()
                        formatted_lines.append(f'<h{level}>{content}</h{level}>')
                    elif len(line.strip()) == 0:
                        formatted_lines.append('<br>')
                    elif line.startswith('- ') or line.startswith('* '):
                        content = line[2:].strip()
                        formatted_lines.append(f'<li>{content}</li>')
                    elif re.match(r'^\d+\.', line):
                        content = re.sub(r'^\d+\.\s*', '', line)
                        formatted_lines.append(f'<li>{content}</li>')
                    else:
                        formatted_lines.append(f'<p>{line}</p>')

                return '\n'.join(formatted_lines)

            else:
                return text
        except Exception as e:
            raise MCPValidationError(f"Failed to format content: {str(e)}")


class MCPAnalysisTools:
    """Advanced analysis tools for MCP servers."""

    @staticmethod
    def sentiment_analysis(text: str) -> Dict[str, Any]:
        """Perform sentiment analysis using proper NLP libraries."""
        try:
            # Try to use NLTK for better sentiment analysis
            try:
                import nltk
                from nltk.sentiment import SentimentIntensityAnalyzer

                # Download VADER lexicon if not already downloaded
                try:
                    nltk.data.find('vader_lexicon')
                except LookupError:
                    nltk.download('vader_lexicon', quiet=True)

                sia = SentimentIntensityAnalyzer()
                scores = sia.polarity_scores(text)

                # Convert NLTK scores to our format
                compound = scores['compound']
                if compound >= 0.05:
                    sentiment = "positive"
                    confidence = compound
                elif compound <= -0.05:
                    sentiment = "negative"
                    confidence = -compound
                else:
                    sentiment = "neutral"
                    confidence = 1 - abs(compound)

                return {
                    "sentiment": sentiment,
                    "confidence": round(confidence, 3),
                    "positive_words": int(scores['pos'] * len(text.split())),
                    "negative_words": int(scores['neg'] * len(text.split())),
                    "total_words": len(text.split()),
                    "positive_score": round(scores['pos'], 3),
                    "negative_score": round(scores['neg'], 3),
                    "library": "nltk"
                }

            except ImportError:
                # Fallback to spaCy if NLTK not available
                try:
                    import spacy
                    from spacytextblob import SpacyTextBlob

                    nlp = spacy.load("en_core_web_sm")
                    nlp.add_pipe('spacytextblob')

                    doc = nlp(text)
                    polarity = doc._.blob.polarity

                    if polarity > 0.1:
                        sentiment = "positive"
                        confidence = polarity
                    elif polarity < -0.1:
                        sentiment = "negative"
                        confidence = -polarity
                    else:
                        sentiment = "neutral"
                        confidence = 1 - abs(polarity)

                    words = text.split()
                    positive_count = sum(1 for word in words if polarity > 0.1)
                    negative_count = sum(1 for word in words if polarity < -0.1)

                    return {
                        "sentiment": sentiment,
                        "confidence": round(confidence, 3),
                        "positive_words": positive_count,
                        "negative_words": negative_count,
                        "total_words": len(words),
                        "positive_score": round(max(0, polarity), 3),
                        "negative_score": round(max(0, -polarity), 3),
                        "library": "spacy"
                    }

                except ImportError:
                    # Final fallback to basic word lists
                    pass

            # Basic word list implementation (fallback)
            positive_words = {
                'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
                'awesome', 'brilliant', 'outstanding', 'superb', 'perfect', 'love',
                'like', 'best', 'happy', 'pleased', 'satisfied', 'delighted'
            }

            negative_words = {
                'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike',
                'poor', 'disappointed', 'unhappy', 'sad', 'angry', 'frustrated',
                'annoyed', 'displeased', 'unsatisfied', 'terrible', 'dreadful'
            }

            words = re.findall(r'\b\w+\b', text.lower())
            total_words = len(words)

            positive_count = sum(1 for word in words if word in positive_words)
            negative_count = sum(1 for word in words if word in negative_words)

            # Calculate sentiment scores
            positive_score = positive_count / total_words if total_words > 0 else 0
            negative_score = negative_count / total_words if total_words > 0 else 0

            # Determine overall sentiment
            if positive_score > negative_score:
                sentiment = "positive"
                confidence = positive_score - negative_score
            elif negative_score > positive_score:
                sentiment = "negative"
                confidence = negative_score - positive_score
            else:
                sentiment = "neutral"
                confidence = 0

            return {
                "sentiment": sentiment,
                "confidence": round(confidence, 3),
                "positive_words": positive_count,
                "negative_words": negative_count,
                "total_words": total_words,
                "positive_score": round(positive_score, 3),
                "negative_score": round(negative_score, 3),
                "library": "basic_wordlist"
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to analyze sentiment: {str(e)}")

    @staticmethod
    def readability_analysis(text: str) -> Dict[str, Any]:
        """Calculate readability metrics for text."""
        try:
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if s.strip()]

            words = []
            for sentence in sentences:
                sentence_words = re.findall(r'\b\w+\b', sentence)
                words.extend(sentence_words)

            total_sentences = len(sentences)
            total_words = len(words)
            total_syllables = sum(MCPAnalysisTools._count_syllables(word) for word in words)

            if total_sentences == 0 or total_words == 0:
                return {"error": "No readable content found"}

            # Flesch Reading Ease
            flesch_score = 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)

            # Flesch-Kincaid Grade Level
            fk_grade = 0.39 * (total_words / total_sentences) + 11.8 * (total_syllables / total_words) - 15.59

            # Determine reading level
            if flesch_score >= 90:
                level = "5th grade"
            elif flesch_score >= 80:
                level = "6th grade"
            elif flesch_score >= 70:
                level = "7th grade"
            elif flesch_score >= 60:
                level = "8th-9th grade"
            elif flesch_score >= 50:
                level = "10th-12th grade"
            elif flesch_score >= 30:
                level = "College"
            else:
                level = "College Graduate"

            return {
                "flesch_reading_ease": round(flesch_score, 2),
                "flesch_kincaid_grade": round(fk_grade, 2),
                "reading_level": level,
                "total_sentences": total_sentences,
                "total_words": total_words,
                "total_syllables": total_syllables,
                "avg_words_per_sentence": round(total_words / total_sentences, 2),
                "avg_syllables_per_word": round(total_syllables / total_words, 2)
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to analyze readability: {str(e)}")

    @staticmethod
    def _count_syllables(word: str) -> int:
        """Count syllables in a word (basic implementation)."""
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

    @staticmethod
    def topic_modeling(text: str, num_topics: int = 3) -> Dict[str, Any]:
        """Perform basic topic modeling using word co-occurrence."""
        try:
            # Simple topic modeling based on word pairs
            sentences = re.split(r'[.!?]+', text)
            words = []

            for sentence in sentences:
                sentence_words = re.findall(r'\b\w+\b', sentence.lower())
                # Remove stop words
                stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
                filtered_words = [w for w in sentence_words if w not in stop_words and len(w) > 2]
                words.extend(filtered_words)

            # Create word pairs (co-occurrence within sentences)
            word_pairs = {}
            for sentence in sentences:
                sentence_words = re.findall(r'\b\w+\b', sentence.lower())
                filtered_words = [w for w in sentence_words if w not in stop_words and len(w) > 2]

                for i in range(len(filtered_words)):
                    for j in range(i + 1, len(filtered_words)):
                        pair = tuple(sorted([filtered_words[i], filtered_words[j]]))
                        word_pairs[pair] = word_pairs.get(pair, 0) + 1

            # Extract topics based on most co-occurring word pairs
            topics = []
            sorted_pairs = sorted(word_pairs.items(), key=lambda x: x[1], reverse=True)

            for i in range(min(num_topics, len(sorted_pairs))):
                pair, count = sorted_pairs[i]
                topics.append({
                    "words": list(pair),
                    "cooccurrence_count": count,
                    "topic_id": i + 1
                })

            return {
                "topics": topics,
                "total_word_pairs": len(word_pairs),
                "method": "word_cooccurrence"
            }
        except Exception as e:
            raise MCPValidationError(f"Failed to perform topic modeling: {str(e)}")
