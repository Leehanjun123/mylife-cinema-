import OpenAI from 'openai';
import axios from 'axios';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Initialize AI services
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIService {
  constructor() {
    this.models = {
      story: 'gpt-4-turbo-preview',
      analysis: 'gpt-4',
      vision: 'gpt-4-vision-preview'
    };
  }

  /**
   * Analyze diary entry and extract key elements
   */
  async analyzeDiary(diaryText, mood = null, images = []) {
    try {
      logger.info('Starting diary analysis');

      const prompt = `
        Analyze this diary entry and extract key storytelling elements:

        Diary: "${diaryText}"
        ${mood ? `Mood: ${mood}` : ''}

        Please provide a JSON response with:
        1. mainTheme: The central theme or topic
        2. emotions: Array of emotions detected (joy, sadness, anger, fear, surprise, disgust)
        3. characters: Array of people mentioned
        4. events: Sequence of events that happened
        5. setting: Time and place information
        6. tone: Overall tone (positive, negative, neutral, mixed)
        7. genre_suggestions: Array of suitable movie genres
        8. conflict: Main conflict or challenge if any
        9. resolution: How things were resolved if applicable
        10. visual_elements: Descriptions of visual scenes

        Return only valid JSON format.
      `;

      const response = await openai.chat.completions.create({
        model: this.models.analysis,
        messages: [
          {
            role: 'system',
            content: 'You are an expert story analyst. Analyze diary entries and extract cinematic elements for movie generation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      logger.info('Diary analysis completed');
      return analysis;

    } catch (error) {
      logger.error('Diary analysis error:', error);
      throw new Error('Failed to analyze diary entry');
    }
  }

  /**
   * Generate movie script based on analysis
   */
  async generateScript(analysis, genre, duration = 15, style = 'cinematic') {
    try {
      logger.info(`Generating ${genre} script for ${duration} minutes`);

      const prompt = `
        Create a ${duration}-minute movie script based on this diary analysis:

        Analysis: ${JSON.stringify(analysis)}
        Genre: ${genre}
        Style: ${style}

        Requirements:
        1. Create a compelling narrative arc
        2. Include dialogue and action descriptions
        3. Break into scenes with timestamps
        4. Add camera directions and visual cues
        5. Incorporate the original emotions and themes
        6. Make it suitable for ${genre} genre
        7. Target duration: ${duration} minutes

        Format as JSON with this structure:
        {
          "title": "Movie title",
          "synopsis": "Brief summary",
          "scenes": [
            {
              "scene_number": 1,
              "timestamp": "00:00-01:30",
              "setting": "Location and time",
              "action": "What happens",
              "dialogue": ["Character: Line"],
              "camera": "Camera direction",
              "mood": "Scene mood",
              "visual_description": "Detailed visual description"
            }
          ],
          "characters": [
            {
              "name": "Character name",
              "description": "Character description",
              "role": "main/supporting"
            }
          ],
          "total_duration": "${duration}:00"
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.models.story,
        messages: [
          {
            role: 'system',
            content: `You are a professional screenwriter specializing in ${genre} films. Create engaging, well-structured scripts that translate personal experiences into cinematic narratives.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const script = JSON.parse(response.choices[0].message.content);
      logger.info('Script generation completed');
      return script;

    } catch (error) {
      logger.error('Script generation error:', error);
      throw new Error('Failed to generate movie script');
    }
  }

  /**
   * Generate video prompts for each scene
   */
  async generateVideoPrompts(script, visualStyle = 'realistic') {
    try {
      logger.info('Generating video prompts for scenes');

      const prompts = await Promise.all(
        script.scenes.map(async (scene, index) => {
          const prompt = `
            Create a detailed video generation prompt for this scene:

            Scene: ${scene.scene_number}
            Setting: ${scene.setting}
            Action: ${scene.action}
            Visual: ${scene.visual_description}
            Mood: ${scene.mood}
            Camera: ${scene.camera}

            Generate a concise but detailed prompt for AI video generation.
            Style: ${visualStyle}
            Duration: ${scene.timestamp}

            Focus on:
            - Visual composition
            - Lighting and mood
            - Character actions
            - Camera movement
            - Environmental details

            Return only the video prompt text.
          `;

          const response = await openai.chat.completions.create({
            model: this.models.story,
            messages: [
              {
                role: 'system',
                content: 'You are an expert in AI video generation prompts. Create detailed, specific prompts that will generate high-quality cinematic scenes.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.6,
            max_tokens: 200
          });

          return {
            scene_number: scene.scene_number,
            timestamp: scene.timestamp,
            prompt: response.choices[0].message.content.trim(),
            duration: this.parseTimestamp(scene.timestamp)
          };
        })
      );

      logger.info('Video prompts generated');
      return prompts;

    } catch (error) {
      logger.error('Video prompt generation error:', error);
      throw new Error('Failed to generate video prompts');
    }
  }

  /**
   * Generate audio script for narration and dialogue
   */
  async generateAudioScript(script, voiceStyle = 'natural') {
    try {
      logger.info('Generating audio script');

      const audioElements = [];

      for (const scene of script.scenes) {
        // Generate narration if needed
        if (scene.action && !scene.dialogue?.length) {
          const narration = await this.generateNarration(scene, voiceStyle);
          audioElements.push({
            type: 'narration',
            scene: scene.scene_number,
            timestamp: scene.timestamp,
            text: narration,
            voice: voiceStyle
          });
        }

        // Process dialogue
        if (scene.dialogue?.length) {
          scene.dialogue.forEach(line => {
            const [character, text] = line.split(': ');
            audioElements.push({
              type: 'dialogue',
              scene: scene.scene_number,
              character: character,
              text: text,
              voice: this.getCharacterVoice(character)
            });
          });
        }
      }

      logger.info('Audio script generated');
      return audioElements;

    } catch (error) {
      logger.error('Audio script generation error:', error);
      throw new Error('Failed to generate audio script');
    }
  }

  /**
   * Generate background music suggestions
   */
  async generateMusicPrompts(script, genre) {
    try {
      logger.info('Generating music prompts');

      const prompt = `
        Create background music prompts for a ${genre} movie with this script:

        Title: ${script.title}
        Synopsis: ${script.synopsis}
        Scenes: ${script.scenes.length}

        Generate music prompts for:
        1. Opening theme
        2. Scene-specific music (for each major scene)
        3. Climax music
        4. Ending theme

        Return JSON format:
        {
          "opening": "Music description for opening",
          "scenes": [
            {
              "scene": 1,
              "music": "Music description"
            }
          ],
          "climax": "Climax music description",
          "ending": "Ending music description"
        }
      `;

      const response = await openai.chat.completions.create({
        model: this.models.analysis,
        messages: [
          {
            role: 'system',
            content: 'You are a film composer. Create detailed music prompts that enhance the emotional impact of scenes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      const musicPrompts = JSON.parse(response.choices[0].message.content);
      logger.info('Music prompts generated');
      return musicPrompts;

    } catch (error) {
      logger.error('Music prompt generation error:', error);
      throw new Error('Failed to generate music prompts');
    }
  }

  // Helper methods
  parseTimestamp(timestamp) {
    const [start, end] = timestamp.split('-');
    const [startMin, startSec] = start.split(':').map(Number);
    const [endMin, endSec] = end.split(':').map(Number);
    return (endMin * 60 + endSec) - (startMin * 60 + startSec);
  }

  async generateNarration(scene, style) {
    const prompt = `
      Create a brief narration for this scene:
      ${scene.action}
      
      Style: ${style}
      Keep it concise and engaging, suitable for a movie narration.
    `;

    const response = await openai.chat.completions.create({
      model: this.models.analysis,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 100
    });

    return response.choices[0].message.content.trim();
  }

  getCharacterVoice(character) {
    // Simple voice assignment logic
    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const hash = character.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return voices[hash % voices.length];
  }
}

export default new AIService();