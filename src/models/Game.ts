import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for this game'],
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for this game'],
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  content: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
  },
  image: {
    type: String,
    required: [true, 'Please provide an image URL'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide an author'],
  },
  progress: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  plays: {
    type: Number,
    default: 0,
  },
  gameDirName: {
    type: String,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  gameType: {
    type: String,
    enum: ['webgl', 'html5', 'javascript', 'unity', 'phaser', 'text', 'pixel', 'wasm'],
    required: true
  },
  files: {
    mainFile: String, // Main entry point (index.html, game.js, etc.)
    assetFiles: [String], // Array of asset file paths
    thumbnails: [String] // Screenshot paths
  },
  settings: {
    width: {
      type: Number,
      default: 800,
    },
    height: {
      type: Number,
      default: 600,
    },
    fullscreen: {
      type: Boolean,
      default: true,
    },
    controls: Object
  },
});

export default mongoose.models.Game || mongoose.model('Game', GameSchema); 