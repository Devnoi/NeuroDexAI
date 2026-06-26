export class MedicalAssessmentEngine {
  /**
   * Processes raw session logs for dual-hand testing and calculates clinical metrics.
   * @param {Array} rawLogs - Array of raw log objects
   * @returns {Object} Calculated metrics and scores
   */
  static analyze(rawLogs, options = {}) {
    const affectedSide = options.affectedSide === 'left' ? 'left' : 'right';
    const emptyResult = {
      overallSpeedScore: 0,
      overallAccuracyScore: 0,
      overallQualityScore: 0,
      overallCognitiveScore: 100,
      leftHand: { speed: 0, accuracy: 0, quality: 0 },
      rightHand: { speed: 0, accuracy: 0, quality: 0 },
      limbSelectionRatio: 0,
      leftDominanceScore: 0,
      rightDominanceScore: 0,
      predictedDominantHand: 'undetermined',
      learnedNonUseRisk: 'undetermined',
      detailedMetrics: {
        left: { RT: 0, MT: 0, successRate: 0, error: 0, jitter: 0, smoothness: 1 },
        right: { RT: 0, MT: 0, successRate: 0, error: 0, jitter: 0, smoothness: 1 }
      }
    };

    if (!rawLogs || rawLogs.length === 0) return emptyResult;

    // 1. Segment Logs into Trials
    const trials = [];
    let currentTrial = null;

    for (let i = 0; i < rawLogs.length; i++) {
      const log = rawLogs[i];
      const hasTarget = log.targetX !== 0 || log.targetY !== 0;

      if (hasTarget) {
        if (!currentTrial) {
          currentTrial = {
            spawnLog: log,
            logs: [log],
            leftMoveLog: null,
            rightMoveLog: null,
            endLog: null
          };
        } else {
          currentTrial.logs.push(log);
        }

        // Detect Left Hand movement onset (>15px deviation from spawn)
        if (!currentTrial.leftMoveLog && log.leftFingerX !== 0) {
          const dx = log.leftFingerX - currentTrial.spawnLog.leftFingerX;
          const dy = log.leftFingerY - currentTrial.spawnLog.leftFingerY;
          if (Math.sqrt(dx * dx + dy * dy) > 15) {
            currentTrial.leftMoveLog = log;
          }
        }

        // Detect Right Hand movement onset (>15px deviation from spawn)
        if (!currentTrial.rightMoveLog && log.rightFingerX !== 0) {
          const dx = log.rightFingerX - currentTrial.spawnLog.rightFingerX;
          const dy = log.rightFingerY - currentTrial.spawnLog.rightFingerY;
          if (Math.sqrt(dx * dx + dy * dy) > 15) {
            currentTrial.rightMoveLog = log;
          }
        }

        // End of trial
        if (log.state === 'hit' || log.state === 'miss') {
          currentTrial.endLog = log;
          trials.push(currentTrial);
          currentTrial = null;
        }
      } else {
        if (currentTrial) {
          currentTrial.endLog = log;
          trials.push(currentTrial);
          currentTrial = null;
        }
      }
    }
    if (currentTrial) trials.push(currentTrial);

    // Initial metrics structures
    const stats = {
      left: { RTs: [], MTs: [], errors: [], hits: 0, trials: 0, smoothness: [] },
      right: { RTs: [], MTs: [], errors: [], hits: 0, trials: 0, smoothness: [] }
    };

    let commissionErrors = 0;
    let omissionErrors = 0;

    trials.forEach(trial => {
      const finalLog = trial.endLog || trial.logs[trial.logs.length - 1];
      if (!finalLog) return;

      const tSpawn = trial.spawnLog.timestamp;
      const usedHand = finalLog.usedHand || 'none'; // 'left', 'right', or 'none'
      const isCorrectTarget = trial.spawnLog.isCorrectTarget !== false; // default true if undefined
      const requiredHand = trial.spawnLog.requiredHand || finalLog.requiredHand || 'any';
      const usedRequiredHand = requiredHand === 'any' || usedHand === requiredHand;
      const isValidHit = finalLog.state === 'hit' && usedHand !== 'none' && isCorrectTarget && usedRequiredHand;

      // Cognitive Scoring:
      if (isCorrectTarget) {
        // Correct target should be hit
        if (finalLog.state === 'hit') {
          if (usedHand !== 'none' && usedRequiredHand) {
            if (usedHand === 'both') {
              stats.left.trials++;
              stats.left.hits++;
              stats.right.trials++;
              stats.right.hits++;
            } else {
              stats[usedHand].trials++;
              stats[usedHand].hits++;
            }
          } else if (usedHand !== 'none') {
            if (usedHand === 'both') {
              stats.left.trials++;
              stats.right.trials++;
            } else {
              stats[usedHand].trials++;
            }
            commissionErrors++;
          }
        } else {
          // Missed a correct target = omission error
          omissionErrors++;
        }
      } else {
        // Incorrect target should be avoided
        if (finalLog.state === 'hit') {
          // Hit an incorrect target = commission error
          commissionErrors++;
          if (usedHand !== 'none') {
            if (usedHand === 'both') {
              stats.left.trials++;
              stats.right.trials++;
            } else {
              stats[usedHand].trials++;
            }
          }
        }
      }

      // Left hand speed calculations
      if (trial.leftMoveLog) {
        stats.left.RTs.push(trial.leftMoveLog.timestamp - tSpawn);
        if ((usedHand === 'left' || usedHand === 'both') && isValidHit) {
          stats.left.MTs.push(finalLog.timestamp - trial.leftMoveLog.timestamp);
        }
      }

      // Right hand speed calculations
      if (trial.rightMoveLog) {
        stats.right.RTs.push(trial.rightMoveLog.timestamp - tSpawn);
        if ((usedHand === 'right' || usedHand === 'both') && isValidHit) {
          stats.right.MTs.push(finalLog.timestamp - trial.rightMoveLog.timestamp);
        }
      }

      // Accuracy Calculations (Euclidean distance on Hit)
      if (isValidHit) {
        if (usedHand === 'both') {
          const distLeft = Math.sqrt(
            Math.pow(finalLog.leftFingerX - finalLog.targetX, 2) +
            Math.pow(finalLog.leftFingerY - finalLog.targetY, 2)
          );
          stats.left.errors.push(distLeft);

          const distRight = Math.sqrt(
            Math.pow(finalLog.rightFingerX - finalLog.targetX, 2) +
            Math.pow(finalLog.rightFingerY - finalLog.targetY, 2)
          );
          stats.right.errors.push(distRight);
        } else {
          const fingerX = usedHand === 'left' ? finalLog.leftFingerX : finalLog.rightFingerX;
          const fingerY = usedHand === 'left' ? finalLog.leftFingerY : finalLog.rightFingerY;
          const dist = Math.sqrt(
            Math.pow(fingerX - finalLog.targetX, 2) +
            Math.pow(fingerY - finalLog.targetY, 2)
          );
          stats[usedHand].errors.push(dist);
        }
      }

      // Smoothness calculations
      ['left', 'right'].forEach(hand => {
        const moveLog = hand === 'left' ? trial.leftMoveLog : trial.rightMoveLog;
        if (moveLog) {
          const tMove = moveLog.timestamp;
          const startIndex = trial.logs.findIndex(l => l.timestamp === tMove);
          const endIndex = trial.logs.findIndex(l => l.timestamp === finalLog.timestamp);
          
          if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            const pathLogs = trial.logs.slice(startIndex, endIndex + 1);
            let pathLength = 0;
            const fxKey = hand === 'left' ? 'leftFingerX' : 'rightFingerX';
            const fyKey = hand === 'left' ? 'leftFingerY' : 'rightFingerY';

            for (let j = 1; j < pathLogs.length; j++) {
              pathLength += Math.sqrt(
                Math.pow(pathLogs[j][fxKey] - pathLogs[j - 1][fxKey], 2) +
                Math.pow(pathLogs[j][fyKey] - pathLogs[j - 1][fyKey], 2)
              );
            }

            const startL = pathLogs[0];
            const endL = pathLogs[pathLogs.length - 1];
            const straightLine = Math.sqrt(
              Math.pow(endL[fxKey] - startL[fxKey], 2) +
              Math.pow(endL[fyKey] - startL[fyKey], 2)
            );

            if (straightLine > 5) {
              stats[hand].smoothness.push(pathLength / straightLine);
            }
          }
        }
      });
    });

    // Cognitive Score Calculation (Starts at 100, floor at 0)
    const overallCognitiveScore = Math.max(0, 100 - (commissionErrors * 15) - (omissionErrors * 5));

    // Resting Jitter calculations (Standard deviation of Y while resting)
    const jitter = { left: 0, right: 0 };
    ['left', 'right'].forEach(hand => {
      const restLogs = rawLogs.filter(log => log.state === 'resting');
      const fyKey = hand === 'left' ? 'leftFingerY' : 'rightFingerY';
      const yCoords = restLogs.map(l => l[fyKey]).filter(y => y > 0);

      if (yCoords.length > 1) {
        const meanY = yCoords.reduce((s, v) => s + v, 0) / yCoords.length;
        const varianceY = yCoords.reduce((s, v) => s + Math.pow(v - meanY, 2), 0) / yCoords.length;
        jitter[hand] = Math.sqrt(varianceY);
      }
    });

    // Helper to calculate averages
    const avg = arr => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

    const results = {};
    ['left', 'right'].forEach(hand => {
      const avgRT = avg(stats[hand].RTs);
      const avgMT = avg(stats[hand].MTs);
      const successRate = stats[hand].trials > 0 ? (stats[hand].hits / stats[hand].trials) * 100 : 0;
      const avgError = avg(stats[hand].errors);
      const avgSmoothness = stats[hand].smoothness.length > 0 ? avg(stats[hand].smoothness) : 1.0;

      // Scoring formulas (0 - 100)
      const rtScore = avgRT > 0 ? Math.max(0, Math.min(100, 100 - (avgRT - 250) * 0.1)) : 0;
      const mtScore = avgMT > 0 ? Math.max(0, Math.min(100, 100 - (avgMT - 500) * 0.08)) : 0;
      const speed = avgRT > 0 && avgMT > 0 ? Math.round((rtScore + mtScore) / 2) : Math.round(rtScore || mtScore || 0);

      const errorScore = stats[hand].errors.length > 0 ? Math.max(0, Math.min(100, 100 - avgError * 1.5)) : 0;
      const accuracy = Math.round((successRate * 0.7) + (errorScore * 0.3));

      const jitterScore = Math.max(0, Math.min(100, 100 - (jitter[hand] * 10)));
      const smoothnessScore = Math.max(0, Math.min(100, 100 - (avgSmoothness - 1.0) * 50));
      const quality = Math.round((jitterScore * 0.4) + (smoothnessScore * 0.6));

      results[hand] = {
        speed,
        accuracy,
        quality,
        detailed: {
          RT: Math.round(avgRT),
          MT: Math.round(avgMT),
          successRate: Math.round(successRate * 10) / 10,
          error: Math.round(avgError * 10) / 10,
          jitter: Math.round(jitter[hand] * 100) / 100,
          smoothness: Math.round(avgSmoothness * 100) / 100
        }
      };
    });

    const randomTrials = trials.filter(t => {
      const finalL = t.endLog || t.logs[t.logs.length - 1];
      return finalL && finalL.usedHand !== 'none';
    });
    
    const selectionRatio = randomTrials.length > 0
      ? Math.round((randomTrials.filter(t => (t.endLog || t.logs[t.logs.length - 1]).usedHand === affectedSide).length / randomTrials.length) * 100)
      : 50;

    const overallSpeedScore = Math.round((results.left.speed + results.right.speed) / 2);
    const overallAccuracyScore = Math.round((results.left.accuracy + results.right.accuracy) / 2);
    const overallQualityScore = Math.round((results.left.quality + results.right.quality) / 2);
    const unaffectedSide = affectedSide === 'left' ? 'right' : 'left';
    const affectedPerformance = Math.round(
      (results[affectedSide].speed * 0.35) +
      (results[affectedSide].accuracy * 0.30) +
      (results[affectedSide].quality * 0.25) +
      (selectionRatio * 0.10)
    );
    const unaffectedSelectionRatio = 100 - selectionRatio;
    const unaffectedPerformance = Math.round(
      (results[unaffectedSide].speed * 0.35) +
      (results[unaffectedSide].accuracy * 0.30) +
      (results[unaffectedSide].quality * 0.25) +
      (unaffectedSelectionRatio * 0.10)
    );
    const leftDominanceScore = affectedSide === 'left' ? affectedPerformance : unaffectedPerformance;
    const rightDominanceScore = affectedSide === 'right' ? affectedPerformance : unaffectedPerformance;
    const scoreGap = Math.abs(leftDominanceScore - rightDominanceScore);
    const predictedDominantHand = scoreGap < 8 ? 'balanced' : (leftDominanceScore > rightDominanceScore ? 'left' : 'right');

    let learnedNonUseRisk = 'low';
    if (results[affectedSide].quality >= 55 && results[affectedSide].accuracy >= 45 && selectionRatio < 25) {
      learnedNonUseRisk = 'high';
    } else if (results[affectedSide].quality >= 45 && selectionRatio < 45) {
      learnedNonUseRisk = 'moderate';
    }

    return {
      overallSpeedScore,
      overallAccuracyScore,
      overallQualityScore,
      overallCognitiveScore,
      leftHand: {
        speed: results.left.speed,
        accuracy: results.left.accuracy,
        quality: results.left.quality
      },
      rightHand: {
        speed: results.right.speed,
        accuracy: results.right.accuracy,
        quality: results.right.quality
      },
      limbSelectionRatio: selectionRatio,
      leftDominanceScore,
      rightDominanceScore,
      predictedDominantHand,
      learnedNonUseRisk,
      detailedMetrics: {
        left: results.left.detailed,
        right: results.right.detailed
      }
    };
  }
}

export default MedicalAssessmentEngine;
