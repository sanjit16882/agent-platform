/**
 * ROI Calculator with Conservative Industry Benchmarks
 * Based on industry research and realistic automation outcomes
 */

export interface ROIInputs {
  teamSize: number;
  avgSalary: number;
  infraCost: number;
  companySize: 'startup' | 'midsize' | 'enterprise';
}

export interface ROIResults {
  monthlyQESavings: number;
  monthlyInfraSavings: number;
  monthlyTotalSavings: number;
  annualSavings: number;
  platformCost: number;
  roi: number;
  paybackMonths: number;
  assumptions: ROIAssumptions;
}

export interface ROIAssumptions {
  qeTimeSavingsPercent: number;
  infraOptimizationPercent: number;
  implementationTimeWeeks: number;
  adoptionRatePercent: number;
  riskAdjustmentFactor: number;
}

/**
 * Conservative industry benchmarks based on research:
 * - Test automation typically saves 15-40% of QE time (we use 25%)
 * - Infrastructure optimization typically achieves 10-20% savings (we use 15%)
 * - Implementation takes 4-12 weeks (we use 8 weeks)
 * - Team adoption is typically 70-90% (we use 75%)
 */
const CONSERVATIVE_ASSUMPTIONS: Record<string, ROIAssumptions> = {
  startup: {
    qeTimeSavingsPercent: 0.20, // 20% time savings (conservative for small teams)
    infraOptimizationPercent: 0.12, // 12% infrastructure savings
    implementationTimeWeeks: 6,
    adoptionRatePercent: 0.80, // Higher adoption in smaller teams
    riskAdjustmentFactor: 0.85 // 15% risk buffer
  },
  midsize: {
    qeTimeSavingsPercent: 0.25, // 25% time savings
    infraOptimizationPercent: 0.15, // 15% infrastructure savings
    implementationTimeWeeks: 8,
    adoptionRatePercent: 0.75, // 75% team adoption
    riskAdjustmentFactor: 0.80 // 20% risk buffer
  },
  enterprise: {
    qeTimeSavingsPercent: 0.30, // 30% time savings (better processes)
    infraOptimizationPercent: 0.18, // 18% infrastructure savings
    implementationTimeWeeks: 12,
    adoptionRatePercent: 0.70, // Lower adoption in large orgs
    riskAdjustmentFactor: 0.75 // 25% risk buffer for complexity
  }
};

/**
 * Platform costs based on realistic SaaS pricing models
 */
const PLATFORM_COSTS = {
  startup: 24000, // $2K/month for small teams
  midsize: 60000, // $5K/month for mid-size companies
  enterprise: 120000 // $10K/month for enterprise
};

/**
 * Calculate ROI with conservative industry benchmarks
 */
export const calculateConservativeROI = (inputs: ROIInputs): ROIResults => {
  const assumptions = CONSERVATIVE_ASSUMPTIONS[inputs.companySize];
  const platformCost = PLATFORM_COSTS[inputs.companySize];

  // QE Savings Calculation (conservative)
  const monthlyQECost = (inputs.teamSize * inputs.avgSalary) / 12;
  const qeTimeSavings = monthlyQECost * assumptions.qeTimeSavingsPercent;
  const adoptionAdjustedQESavings = qeTimeSavings * assumptions.adoptionRatePercent;
  const monthlyQESavings = adoptionAdjustedQESavings * assumptions.riskAdjustmentFactor;

  // Infrastructure Savings Calculation (conservative)
  const monthlyInfraOptimization = inputs.infraCost * assumptions.infraOptimizationPercent;
  const monthlyInfraSavings = monthlyInfraOptimization * assumptions.riskAdjustmentFactor;

  // Total calculations
  const monthlyTotalSavings = monthlyQESavings + monthlyInfraSavings;
  const annualSavings = monthlyTotalSavings * 12;
  
  // ROI calculation with implementation delay
  const implementationDelay = assumptions.implementationTimeWeeks / 4; // Convert to months
  const effectiveAnnualSavings = annualSavings * (12 - implementationDelay) / 12;
  
  const roi = ((effectiveAnnualSavings - platformCost) / platformCost) * 100;
  const paybackMonths = platformCost / monthlyTotalSavings + implementationDelay;

  return {
    monthlyQESavings,
    monthlyInfraSavings,
    monthlyTotalSavings,
    annualSavings: effectiveAnnualSavings,
    platformCost,
    roi,
    paybackMonths,
    assumptions
  };
};

/**
 * Get realistic industry benchmarks for display
 */
export const getIndustryBenchmarks = (companySize: string) => {
  const assumptions = CONSERVATIVE_ASSUMPTIONS[companySize as keyof typeof CONSERVATIVE_ASSUMPTIONS];
  
  return {
    qeAutomationSavings: `${(assumptions.qeTimeSavingsPercent * 100).toFixed(0)}%`,
    infraOptimization: `${(assumptions.infraOptimizationPercent * 100).toFixed(0)}%`,
    implementationTime: `${assumptions.implementationTimeWeeks} weeks`,
    teamAdoption: `${(assumptions.adoptionRatePercent * 100).toFixed(0)}%`,
    riskBuffer: `${((1 - assumptions.riskAdjustmentFactor) * 100).toFixed(0)}%`
  };
};

/**
 * Format currency values for display
 */
export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
};

/**
 * Get credible assumptions text for transparency
 */
export const getAssumptionsText = (companySize: string): string[] => {
  const benchmarks = getIndustryBenchmarks(companySize);
  
  return [
    `QE time savings: ${benchmarks.qeAutomationSavings} (based on test automation industry studies)`,
    `Infrastructure optimization: ${benchmarks.infraOptimization} (typical cloud cost optimization results)`,
    `Implementation period: ${benchmarks.implementationTime} (includes training and adoption)`,
    `Team adoption rate: ${benchmarks.teamAdoption} (realistic organizational change management)`,
    `Risk adjustment: ${benchmarks.riskBuffer} buffer applied to all projections`
  ];
};