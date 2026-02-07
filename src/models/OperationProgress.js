/**
 * In-memory operation progress tracking
 * Tracks the status of manual operations (scrape, process, AI supplement)
 * Supports pause, resume, and cancel controls
 */

// Store operation state in memory (resets on restart, which is fine for operations)
let currentOperation = null;
let cancelRequested = false;
let pauseRequested = false;

const OperationProgress = {
  /**
   * Start a new operation
   * @param {string} type - 'scrape', 'supplement', 'full-refresh', 'process-all'
   */
  start(type) {
    cancelRequested = false;
    pauseRequested = false;

    currentOperation = {
      type,
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null,

      // Scraping stats
      totalSources: 0,
      sourcesProcessed: 0,
      currentSource: null,
      articlesFound: 0,
      articlesAdded: 0,
      articlesSkipped: 0,
      sourceErrors: 0,

      // Processing stats
      articlesToProcess: 0,
      articlesProcessed: 0,
      articlesApproved: 0,
      articlesRejected: 0,
      currentArticle: null,

      // Queue stats
      articlesQueued: 0,

      // AI generation stats
      aiArticlesToGenerate: 0,
      aiArticlesGenerated: 0,
      aiCurrentCategory: null,

      // Progress tracking
      currentStep: 1,
      totalSteps: type === 'full-refresh' ? 3 : 1,
      stepName: type === 'scrape' ? 'Scraping RSS Feeds' :
                type === 'supplement' ? 'Generating AI Articles' :
                type === 'process-all' ? 'Processing All Pending Articles' :
                'Step 1: Scraping RSS Feeds',

      // Messages log (last 50)
      messages: [],

      // Error if any
      error: null
    };

    this.log(`Started ${type} operation`);
    return currentOperation;
  },

  /**
   * Get current operation status
   */
  get() {
    return currentOperation;
  },

  /**
   * Check if cancel was requested
   * @returns {boolean}
   */
  isCancelRequested() {
    return cancelRequested;
  },

  /**
   * Check if pause was requested. If paused, returns a promise that resolves when resumed.
   * Use: await OperationProgress.checkPause()
   * @returns {Promise<void>}
   */
  async checkPause() {
    while (pauseRequested && !cancelRequested) {
      if (currentOperation && currentOperation.status !== 'paused') {
        currentOperation.status = 'paused';
        this.log('Operation paused');
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (currentOperation && currentOperation.status === 'paused') {
      currentOperation.status = 'running';
      this.log('Operation resumed');
    }
  },

  /**
   * Request pause
   */
  pause() {
    if (!currentOperation || currentOperation.status !== 'running') return;
    pauseRequested = true;
    this.log('Pause requested...');
  },

  /**
   * Resume from pause
   */
  resume() {
    pauseRequested = false;
  },

  /**
   * Request cancel
   */
  cancel() {
    cancelRequested = true;
    pauseRequested = false; // Unpause if paused so cancel can take effect
    if (currentOperation) {
      this.log('Cancel requested...');
    }
  },

  /**
   * Update operation progress
   * @param {Object} updates - Fields to update
   */
  update(updates) {
    if (!currentOperation) return null;

    Object.assign(currentOperation, updates);
    return currentOperation;
  },

  /**
   * Add a log message
   * @param {string} message
   */
  log(message) {
    if (!currentOperation) return;

    currentOperation.messages.push({
      time: new Date().toISOString(),
      text: message
    });

    // Keep only last 50 messages
    if (currentOperation.messages.length > 50) {
      currentOperation.messages = currentOperation.messages.slice(-50);
    }
  },

  /**
   * Set current step (for full-refresh)
   */
  setStep(step, name) {
    if (!currentOperation) return;
    currentOperation.currentStep = step;
    currentOperation.stepName = name;
    this.log(`Starting ${name}`);
  },

  /**
   * Update scraping progress
   */
  updateScraping({ totalSources, sourcesProcessed, currentSource, articlesFound, articlesAdded, articlesSkipped, sourceErrors }) {
    if (!currentOperation) return;

    if (totalSources !== undefined) currentOperation.totalSources = totalSources;
    if (sourcesProcessed !== undefined) currentOperation.sourcesProcessed = sourcesProcessed;
    if (currentSource !== undefined) currentOperation.currentSource = currentSource;
    if (articlesFound !== undefined) currentOperation.articlesFound = articlesFound;
    if (articlesAdded !== undefined) currentOperation.articlesAdded = articlesAdded;
    if (articlesSkipped !== undefined) currentOperation.articlesSkipped = articlesSkipped;
    if (sourceErrors !== undefined) currentOperation.sourceErrors = sourceErrors;
  },

  /**
   * Update processing progress
   */
  updateProcessing({ articlesToProcess, articlesProcessed, articlesApproved, articlesRejected, articlesQueued, currentArticle }) {
    if (!currentOperation) return;

    if (articlesToProcess !== undefined) currentOperation.articlesToProcess = articlesToProcess;
    if (articlesProcessed !== undefined) currentOperation.articlesProcessed = articlesProcessed;
    if (articlesApproved !== undefined) currentOperation.articlesApproved = articlesApproved;
    if (articlesRejected !== undefined) currentOperation.articlesRejected = articlesRejected;
    if (articlesQueued !== undefined) currentOperation.articlesQueued = articlesQueued;
    if (currentArticle !== undefined) currentOperation.currentArticle = currentArticle;
  },

  /**
   * Update AI generation progress
   */
  updateAI({ aiArticlesToGenerate, aiArticlesGenerated, aiCurrentCategory }) {
    if (!currentOperation) return;

    if (aiArticlesToGenerate !== undefined) currentOperation.aiArticlesToGenerate = aiArticlesToGenerate;
    if (aiArticlesGenerated !== undefined) currentOperation.aiArticlesGenerated = aiArticlesGenerated;
    if (aiCurrentCategory !== undefined) currentOperation.aiCurrentCategory = aiCurrentCategory;
  },

  /**
   * Complete the operation
   */
  complete(error = null) {
    if (!currentOperation) return null;

    if (cancelRequested && !error) {
      currentOperation.status = 'cancelled';
      this.log('Operation cancelled by user');
    } else {
      currentOperation.status = error ? 'error' : 'completed';
    }

    currentOperation.completedAt = new Date().toISOString();
    currentOperation.error = error;
    cancelRequested = false;
    pauseRequested = false;

    if (error) {
      this.log(`Operation failed: ${error}`);
    } else if (currentOperation.status !== 'cancelled') {
      this.log('Operation completed successfully');
    }

    return currentOperation;
  },

  /**
   * Calculate overall progress percentage
   */
  getProgressPercent() {
    if (!currentOperation) return 0;

    const { type, currentStep, totalSteps } = currentOperation;
    let stepProgress = 0;

    if (type === 'full-refresh') {
      // Step 1: Scraping
      if (currentStep === 1) {
        const { totalSources, sourcesProcessed } = currentOperation;
        stepProgress = totalSources > 0 ? (sourcesProcessed / totalSources) * 100 : 0;
      }
      // Step 2: Processing
      else if (currentStep === 2) {
        const { articlesToProcess, articlesProcessed } = currentOperation;
        stepProgress = articlesToProcess > 0 ? (articlesProcessed / articlesToProcess) * 100 : 0;
      }
      // Step 3: AI Supplement
      else if (currentStep === 3) {
        const { aiArticlesToGenerate, aiArticlesGenerated } = currentOperation;
        stepProgress = aiArticlesToGenerate > 0 ? (aiArticlesGenerated / aiArticlesToGenerate) * 100 : 100;
      }

      // Overall progress across steps
      const baseProgress = ((currentStep - 1) / totalSteps) * 100;
      const currentStepContribution = (stepProgress / totalSteps);
      return Math.min(100, baseProgress + currentStepContribution);
    }

    // Single-step operations
    if (type === 'scrape') {
      const { totalSources, sourcesProcessed } = currentOperation;
      return totalSources > 0 ? (sourcesProcessed / totalSources) * 100 : 0;
    }

    if (type === 'supplement') {
      const { aiArticlesToGenerate, aiArticlesGenerated } = currentOperation;
      return aiArticlesToGenerate > 0 ? (aiArticlesGenerated / aiArticlesToGenerate) * 100 : 0;
    }

    if (type === 'process-all') {
      const { articlesToProcess, articlesProcessed } = currentOperation;
      return articlesToProcess > 0 ? (articlesProcessed / articlesToProcess) * 100 : 0;
    }

    return 0;
  },

  /**
   * Clear operation (for manual reset)
   */
  clear() {
    currentOperation = null;
    cancelRequested = false;
    pauseRequested = false;
  }
};

module.exports = OperationProgress;
