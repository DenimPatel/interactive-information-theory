
export interface DataPoint {
  x: number;
  y: number; // For fitting, this is y_noisy
}

export interface GeneratedDataPoint {
  x: number;
  y_true: number;
  y_noisy: number;
}

export interface LogPriorUniformType {
  a_min: number; a_max: number;
  b_min: number; b_max: number;
}

/**
 * Generates noisy data following an exponential model y = a * exp(b * x) + noise.
 * @param a_true True amplitude parameter.
 * @param b_true True rate parameter (e.g., negative for decay).
 * @param num_points Number of data points to generate.
 * @param noise_std Standard deviation of the Gaussian noise.
 * @param x_range Array [min_x, max_x] for x values.
 * @returns Array of GeneratedDataPoint objects.
 */
export const generateExponentialData = (
  a_true: number,
  b_true: number,
  num_points: number,
  noise_std: number,
  x_range: [number, number] = [0, 10]
): GeneratedDataPoint[] => {
  const data: GeneratedDataPoint[] = [];
  const [min_x, max_x] = x_range;
  const x_step = num_points > 1 ? (max_x - min_x) / (num_points - 1) : 0;

  for (let i = 0; i < num_points; i++) {
    const x = min_x + i * x_step;
    const y_true = a_true * Math.exp(b_true * x);
    // Generate Gaussian noise (Box-Muller transform basic version)
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const noise = noise_std * z0;
    const y_noisy = y_true + noise;
    data.push({ x, y_true, y_noisy });
  }
  return data;
};

/**
 * Calculates the log-likelihood of the data given parameters for an exponential model with Gaussian noise.
 * LogLikelihood = sum_i [-log(sqrt(2*PI)*sigma) - ( (y_i - (a * exp(b * x_i)))^2 / (2*sigma^2) )]
 * @param data Array of {x, y} data points (y is y_noisy).
 * @param a Candidate amplitude parameter.
 * @param b Candidate rate parameter.
 * @param noise_std Standard deviation of the Gaussian noise (assumed known).
 * @returns The log-likelihood value.
 */
const logLikelihoodGaussianExponential = (
  data: DataPoint[],
  a: number,
  b: number,
  noise_std: number
): number => {
  if (noise_std <= 0) return -Infinity; // Invalid sigma

  let sum_log_likelihood = 0;
  const constant_term = -Math.log(Math.sqrt(2 * Math.PI) * noise_std);

  for (const point of data) {
    const y_pred = a * Math.exp(b * point.x);
    const residual_sq = (point.y - y_pred) ** 2;
    const likelihood_term = -residual_sq / (2 * noise_std ** 2);
    sum_log_likelihood += (constant_term + likelihood_term);
  }
  return sum_log_likelihood;
};

/**
 * Calculates the log-prior for parameters 'a' and 'b' assuming uniform distributions.
 * @param a Candidate amplitude.
 * @param b Candidate rate.
 * @param prior_params Object containing min/max for 'a' and 'b' priors.
 * @returns 0 if parameters are within prior ranges, -Infinity otherwise.
 */
const logPriorUniform = (
  a: number,
  b: number,
  prior_params: LogPriorUniformType
): number => {
  if (a >= prior_params.a_min && a <= prior_params.a_max &&
      b >= prior_params.b_min && b <= prior_params.b_max) {
    // For uniform priors, the log prior is constant within the range.
    // The actual value of the constant doesn't matter for MAP as it cancels out
    // or simply shifts the posterior. We use 0 for simplicity.
    return 0;
  }
  return -Infinity; // Outside prior range
};

/**
 * Finds the Maximum A Posteriori (MAP) estimates for 'a' and 'b' in an exponential model
 * y = a * exp(b * x) using a grid search.
 * @param data Array of {x, y} data points.
 * @param noise_std Known standard deviation of the noise.
 * @param prior_params Parameters for uniform priors on 'a' and 'b'.
 * @param grid_config Configuration for the grid search (number of steps for a and b).
 * @returns Object with a_map, b_map, and the grid of log_posterior_values.
 */
export const findMAPExponential = (
  data: DataPoint[],
  noise_std: number,
  prior_params: LogPriorUniformType,
  grid_config: { a_steps: number; b_steps: number }
): { 
    a_map: number; 
    b_map: number; 
    log_posterior_grid_values: number[][]; 
    a_grid_values: number[]; 
    b_grid_values: number[]; 
} => {
  let best_a = prior_params.a_min;
  let best_b = prior_params.b_min;
  let max_log_posterior = -Infinity;

  const a_values: number[] = [];
  const b_values: number[] = [];
  const log_posterior_grid: number[][] = [];

  const a_step_size = grid_config.a_steps > 1 ? (prior_params.a_max - prior_params.a_min) / (grid_config.a_steps - 1) : 0;
  for (let i = 0; i < grid_config.a_steps; i++) {
    a_values.push(prior_params.a_min + i * a_step_size);
  }
   // Ensure max is included if steps > 1 and there's no floating point issue
  if (grid_config.a_steps > 1 && a_values[a_values.length - 1] < prior_params.a_max - 1e-9) { 
    a_values[a_values.length - 1] = prior_params.a_max;
  }
  if (grid_config.a_steps === 1) a_values[0] = (prior_params.a_min + prior_params.a_max) / 2;


  const b_step_size = grid_config.b_steps > 1 ? (prior_params.b_max - prior_params.b_min) / (grid_config.b_steps - 1) : 0;
  for (let i = 0; i < grid_config.b_steps; i++) {
    b_values.push(prior_params.b_min + i * b_step_size);
  }
  if (grid_config.b_steps > 1 && b_values[b_values.length - 1] < prior_params.b_max - 1e-9) {
     b_values[b_values.length - 1] = prior_params.b_max;
  }
   if (grid_config.b_steps === 1) b_values[0] = (prior_params.b_min + prior_params.b_max) / 2;


  // For Plotly heatmap: z[i][j] where i is y-axis (b_values), j is x-axis (a_values)
  for (let j = 0; j < b_values.length; j++) { // Iterate b for rows of Z
    const b_candidate = b_values[j];
    const currentRow: number[] = [];
    for (let i = 0; i < a_values.length; i++) { // Iterate a for columns of Z
      const a_candidate = a_values[i];
      
      const log_likelihood = logLikelihoodGaussianExponential(data, a_candidate, b_candidate, noise_std);
      const log_prior = logPriorUniform(a_candidate, b_candidate, prior_params);
      const current_log_posterior = log_likelihood + log_prior;
      currentRow.push(current_log_posterior);

      if (current_log_posterior > max_log_posterior) {
        max_log_posterior = current_log_posterior;
        best_a = a_candidate;
        best_b = b_candidate;
      }
    }
    log_posterior_grid.push(currentRow);
  }

  return { 
    a_map: best_a, 
    b_map: best_b, 
    log_posterior_grid_values: log_posterior_grid, 
    a_grid_values: a_values, 
    b_grid_values: b_values 
  };
};
