export interface CountryOption {
  code: string
  dialCode: string
  flagUrl: string
}
 
function flagUrl(isoCode: string): string {
  return `https://flagcdn.com/${isoCode.toLowerCase()}.svg`
}
 
export const SHIPPING_COUNTRIES: CountryOption[] = [
  { code: 'IT', dialCode: '+39', flagUrl: flagUrl('IT') },
  { code: 'FR', dialCode: '+33', flagUrl: flagUrl('FR') },
  { code: 'BE', dialCode: '+32', flagUrl: flagUrl('BE') },
  { code: 'CH', dialCode: '+41', flagUrl: flagUrl('CH') },
  { code: 'ES', dialCode: '+34', flagUrl: flagUrl('ES') },
]
 