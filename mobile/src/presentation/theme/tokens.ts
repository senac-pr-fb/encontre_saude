// Convertido de frontend/config/config.css — manter os dois em sincronia.

export const colors = {
  greenDark: '#2A5C43',
  greenMedium: '#4A8B68',
  greenLight: '#C7DAB7',
  greenAccent: '#E8F5E9',
  background: '#F8F9FA', // --beige-light
  white: '#FFFFFF',
  grayMedium: '#797979',
  grayLight: '#EBEBEB',
  blackDark: '#1A1A1A',
  text: '#2D3436',
  textLight: '#636E72',
  btnActive: '#1E4230',
  error: '#FF6B6B',
  success: '#2ECC71',
} as const;

export const radius = { sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

// RN não tem box-shadow: iOS usa shadow*, Android usa elevation.
export const shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 32, shadowOffset: { width: 0, height: 16 }, elevation: 12 },
} as const;
