export interface SplashScreenProps {
  /**
   * Status line shown beneath the spinner.
   * Defaults to the Arabic "loading data" copy from the design.
   */
  message?: string;
  /**
   * `true`  → fills the viewport (use as a route/app boot screen).
   * `false` → fills its parent container (use as an in-panel loader).
   * @default true
   */
  fullScreen?: boolean;
}
