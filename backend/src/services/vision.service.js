import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import axios from 'axios';
import { createCanvas, Image } from 'canvas';

// Register the canvas backend for tensorflow.js
global.HTMLImageElement = Image;
global.HTMLCanvasElement = createCanvas().constructor;

let model;

// Helper function to load the model once when the service is first used.
const loadModel = async () => {
  if (!model) {
    console.log('Loading MobileNet model...');
    model = await mobilenet.load();
    console.log('MobileNet model loaded successfully.');
  }
  return model;
};

/**
 * Downloads an image and converts it to a TensorFlow tensor.
 * @param {string} imageUrl The URL of the image to process.
 * @returns {Promise<tf.Tensor3D>} A promise that resolves to an image tensor.
 */
const imageToTensor = async (imageUrl) => {
  // Create an HTML Image element
  const image = new Image();
  
  // Convert the image URL to a base64 data URL
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const base64Image = Buffer.from(response.data).toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Image}`;
  
  return new Promise((resolve, reject) => {
    image.onload = () => {
      // Convert the image to a tensor
      const tensor = tf.browser.fromPixels(image);
      resolve(tensor);
    };
    image.onerror = (error) => reject(error);
    image.src = dataUrl;
  });
};

/**
 * Analyzes an image URL using a local TensorFlow.js model.
 * @param {string} imageUrl The public URL of the image to analyze.
 * @returns {Promise<string[]>} A promise that resolves to an array of string tags.
 */
export const analyzeImage = async (imageUrl) => {
  try {
    await loadModel();
    console.log(`Analyzing image with TensorFlow.js: ${imageUrl}`);
    
    const imageTensor = await imageToTensor(imageUrl);
    const predictions = await model.classify(imageTensor);
    
    // Clean up the tensor to free up memory
    imageTensor.dispose();

    // The predictions look like: [{ className: 'space shuttle', probability: 0.91 }, ...]
    // We'll take the top 5 predictions with a confidence > 5%
    const tags = predictions
      .filter(p => p.probability > 0.05)
      .slice(0, 5)
      .map(p => p.className.toLowerCase());
      
    console.log('Detected Tags:', tags);
    return tags;
  } catch (error) {
    console.error('ERROR analyzing image with TensorFlow.js:', error.message);
    return [];
  }
};