/**
 * SnapRegister Brand Theme
 *
 * Central theme configuration for consistent branding across the app
 */

export const colors = {
  // Primary Brand Colors
  primary: '#3DBFB0',        // Teal - Primary accent/buttons
  primaryDark: '#1A3A52',    // Navy Blue - Primary dark

  // Secondary Colors
  secondary: '#4CAF50',      // Green - Success states
  warning: '#FF9500',        // Orange - Warning states
  error: '#FF3B30',          // Red - Error/destructive actions

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',

  // Text Colors
  text: {
    primary: '#1A3A52',      // Navy for primary text
    secondary: '#666666',    // Medium gray for secondary text
    tertiary: '#999999',     // Light gray for tertiary text
    placeholder: '#999999',  // Placeholder text
    inverse: '#FFFFFF',      // White text on dark backgrounds
  },

  // Background Colors
  background: {
    primary: '#F5F5F5',      // Light gray background
    secondary: '#FFFFFF',    // White background
    tertiary: '#F9F9F9',     // Very light gray
    card: '#FFFFFF',         // Card background
  },

  // Border Colors
  border: {
    light: '#F0F0F0',        // Light borders
    medium: '#E0E0E0',       // Medium borders
    dark: '#CCCCCC',         // Dark borders
  },

  // Status Colors
  status: {
    success: '#4CAF50',      // Green
    warning: '#FF9500',      // Orange
    error: '#FF3B30',        // Red
    info: '#3DBFB0',         // Teal
  },

  // Component-specific Colors
  icon: {
    primary: '#3DBFB0',      // Teal icons
    secondary: '#1A3A52',    // Navy icons
    tertiary: '#999999',     // Gray icons
  },

  // Special Use Cases
  overlay: 'rgba(0, 0, 0, 0.3)',
  shadow: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 15,
  round: 50,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  xxxl: 24,
  heading: 28,
  title: 32,
};

export const fontWeight = {
  regular: '400' as '400',
  medium: '500' as '500',
  semibold: '600' as '600',
  bold: '700' as '700',
};

export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

export default theme;
