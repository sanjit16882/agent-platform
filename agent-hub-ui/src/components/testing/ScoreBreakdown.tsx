import React from 'react';
import Card from '../common/Card';
import { theme } from '../../styles/theme';

interface ScoreBreakdownProps {
  overallScore: number;
  criteriaResults?: Array<{
    criterion: string;
    score: number;
    earnedPoints: number;
    maxPoints: number;
    weight: number;
    feedback: string;
    passed: boolean;
  }>;
  categoryScores?: Record<string, number>;
  showDetails?: boolean;
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  overallScore,
  criteriaResults,
  categoryScores,
  showDetails = true
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return theme.colors.success;
    if (score >= 80) return '#10b981'; // green-500
    if (score >= 70) return theme.colors.warning;
    if (score >= 60) return '#f59e0b'; // amber-500
    return theme.colors.danger;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Acceptable';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>📊 Score Breakdown</Card.Title>
        <Card.Text>Detailed analysis of test performance</Card.Text>
      </Card.Header>
      <Card.Body>
        {/* Overall Score */}
        <div style={{
          padding: theme.spacing.xl,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: theme.borderRadius.lg,
          marginBottom: theme.spacing.xl,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: getScoreColor(overallScore),
            marginBottom: theme.spacing.sm
          }}>
            {overallScore.toFixed(1)}%
          </div>
          <div style={{
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.xs
          }}>
            Overall Score
          </div>
          <div style={{
            display: 'inline-block',
            padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
            backgroundColor: getScoreColor(overallScore),
            color: theme.colors.white,
            borderRadius: theme.borderRadius.full,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold
          }}>
            {getScoreLabel(overallScore)}
          </div>
        </div>

        {/* Score Distribution */}
        <div style={{
          padding: theme.spacing.lg,
          backgroundColor: '#e7f3ff',
          border: '1px solid #0066cc',
          borderRadius: theme.borderRadius.md,
          marginBottom: theme.spacing.xl
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            marginBottom: theme.spacing.md,
            color: theme.colors.textPrimary
          }}>
            📈 How Your Score Compares
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.typography.fontSize.sm }}>
              <span>Excellent (90-100%)</span>
              <span style={{ color: theme.colors.textMuted }}>Top 10%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.typography.fontSize.sm }}>
              <span>Good (80-89%)</span>
              <span style={{ color: theme.colors.textMuted }}>Top 40%</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: overallScore >= 70 && overallScore < 80 ? theme.typography.fontWeight.bold : 'normal',
              color: overallScore >= 70 && overallScore < 80 ? theme.colors.primary : 'inherit'
            }}>
              <span>Acceptable (70-79%)</span>
              <span style={{ color: theme.colors.textMuted }}>
                {overallScore >= 70 && overallScore < 80 ? '← You are here' : 'Average'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.typography.fontSize.sm }}>
              <span>Needs Improvement (60-69%)</span>
              <span style={{ color: theme.colors.textMuted }}>Below Average</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.typography.fontSize.sm }}>
              <span>Poor (0-59%)</span>
              <span style={{ color: theme.colors.textMuted }}>Bottom 5%</span>
            </div>
          </div>
        </div>

        {/* Criteria Results */}
        {showDetails && criteriaResults && criteriaResults.length > 0 && (
          <div style={{ marginBottom: theme.spacing.xl }}>
            <div style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
              color: theme.colors.textPrimary
            }}>
              Individual Criteria Scores
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {criteriaResults.map((criterion, index) => (
                <div
                  key={index}
                  style={{
                    padding: theme.spacing.lg,
                    backgroundColor: criterion.passed ? theme.colors.successLight : theme.colors.warningLight,
                    border: `1px solid ${criterion.passed ? theme.colors.success : theme.colors.warning}`,
                    borderRadius: theme.borderRadius.md
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing.sm
                  }}>
                    <div style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.textPrimary
                    }}>
                      {criterion.passed ? '✅' : '⚠️'} {criterion.criterion.charAt(0).toUpperCase() + criterion.criterion.slice(1)}
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.bold,
                      color: getScoreColor(criterion.score)
                    }}>
                      {criterion.earnedPoints}/{criterion.maxPoints}
                    </div>
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing.xs
                  }}>
                    {criterion.feedback}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.textMuted
                  }}>
                    Weight: {(criterion.weight * 100).toFixed(0)}% • Score: {criterion.score}/100
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Scores */}
        {showDetails && categoryScores && Object.keys(categoryScores).length > 0 && (
          <div>
            <div style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.lg,
              color: theme.colors.textPrimary
            }}>
              Category Performance
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {Object.entries(categoryScores).map(([category, score]) => (
                <div key={category}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.xs,
                    fontSize: theme.typography.fontSize.sm
                  }}>
                    <span style={{
                      textTransform: 'capitalize',
                      fontWeight: theme.typography.fontWeight.medium
                    }}>
                      {category.replace('_', ' ')}
                    </span>
                    <span style={{
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: getScoreColor(score)
                    }}>
                      {score.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    backgroundColor: theme.colors.gray200,
                    borderRadius: theme.borderRadius.full,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${score}%`,
                      backgroundColor: getScoreColor(score),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement Tips */}
        {overallScore < 90 && (
          <div style={{
            marginTop: theme.spacing.xl,
            padding: theme.spacing.lg,
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: theme.borderRadius.md
          }}>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: theme.colors.textPrimary
            }}>
              💡 How to Improve Your Score
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: theme.spacing.xl,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary
            }}>
              {overallScore < 70 && (
                <>
                  <li>Review failing test criteria and address specific issues</li>
                  <li>Ensure responses directly address the input questions</li>
                  <li>Provide more complete and detailed responses</li>
                </>
              )}
              {overallScore >= 70 && overallScore < 80 && (
                <>
                  <li>Improve response completeness with more details</li>
                  <li>Ensure output format matches expectations</li>
                  <li>Reduce any hallucinations or unverified claims</li>
                </>
              )}
              {overallScore >= 80 && overallScore < 90 && (
                <>
                  <li>Perfect the output format to match expectations exactly</li>
                  <li>Eliminate all hallucinations and unverified claims</li>
                  <li>Provide comprehensive responses covering all aspects</li>
                </>
              )}
              <li>Target score: {overallScore < 70 ? '70+' : overallScore < 80 ? '80+' : '90+'} for {overallScore < 70 ? 'passing' : overallScore < 80 ? 'good' : 'excellent'} performance</li>
            </ul>
          </div>
        )}

        {/* Scoring Transparency Note */}
        <div style={{
          marginTop: theme.spacing.xl,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.textMuted,
          textAlign: 'center'
        }}>
          ℹ️ Scores are calculated in real-time based on weighted criteria evaluation.
          <br />
          Each test uses specific scoring rules to ensure objective and consistent results.
        </div>
      </Card.Body>
    </Card>
  );
};

export default ScoreBreakdown;
