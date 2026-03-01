/**
 * ===== FILE: TM_resale_scraper.gs =====
 * Thrifty Mobile Quantum 5.0 - Device Resale Price Scraper
 *
 * Retrieves resale pricing data from eBay, Swappa, and Gazelle
 * for high-value devices and aggregates results into the
 * RESALE_PRICE_TRACKER sheet for cross-platform market analysis.
 */

// =============================================================================
// HIGH-VALUE DEVICE CATALOG
// =============================================================================

/**
 * Comprehensive catalog of high-value devices to track.
 * Each entry defines the search terms and slugs for each platform.
 */
const TM_RESALE_DEVICE_CATALOG = [
  // -----------------------------------------------------------------------
  // iPhones (12 and newer, emphasis on Pro models)
  // -----------------------------------------------------------------------
  {category: 'Phone', brand: 'Apple', model: 'iPhone 16 Pro Max', storage: '256GB', ebayQuery: 'iPhone 16 Pro Max 256GB', swappaSlug: 'apple-iphone-16-pro-max', gazelleSlug: 'iphone-16-pro-max'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 16 Pro Max', storage: '512GB', ebayQuery: 'iPhone 16 Pro Max 512GB', swappaSlug: 'apple-iphone-16-pro-max', gazelleSlug: 'iphone-16-pro-max'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 16 Pro', storage: '128GB', ebayQuery: 'iPhone 16 Pro 128GB', swappaSlug: 'apple-iphone-16-pro', gazelleSlug: 'iphone-16-pro'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 16 Pro', storage: '256GB', ebayQuery: 'iPhone 16 Pro 256GB', swappaSlug: 'apple-iphone-16-pro', gazelleSlug: 'iphone-16-pro'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 16', storage: '128GB', ebayQuery: 'iPhone 16 128GB', swappaSlug: 'apple-iphone-16', gazelleSlug: 'iphone-16'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 15 Pro Max', storage: '256GB', ebayQuery: 'iPhone 15 Pro Max 256GB', swappaSlug: 'apple-iphone-15-pro-max', gazelleSlug: 'iphone-15-pro-max'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 15 Pro Max', storage: '512GB', ebayQuery: 'iPhone 15 Pro Max 512GB', swappaSlug: 'apple-iphone-15-pro-max', gazelleSlug: 'iphone-15-pro-max'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 15 Pro', storage: '128GB', ebayQuery: 'iPhone 15 Pro 128GB', swappaSlug: 'apple-iphone-15-pro', gazelleSlug: 'iphone-15-pro'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 15 Pro', storage: '256GB', ebayQuery: 'iPhone 15 Pro 256GB', swappaSlug: 'apple-iphone-15-pro', gazelleSlug: 'iphone-15-pro'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 15', storage: '128GB', ebayQuery: 'iPhone 15 128GB', swappaSlug: 'apple-iphone-15', gazelleSlug: 'iphone-15'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '128GB', ebayQuery: 'iPhone 14 Pro Max 128GB', swappaSlug: 'apple-iphone-14-pro-max', gazelleSlug: 'iphone-14-pro-max'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 14 Pro Max', storage: '256GB', ebayQuery: 'iPhone 14 Pro Max 256GB', swappaSlug: 'apple-iphone-14-pro-max', gazelleSlug: 'iphone-14-pro-max'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 14 Pro', storage: '128GB', ebayQuery: 'iPhone 14 Pro 128GB', swappaSlug: 'apple-iphone-14-pro', gazelleSlug: 'iphone-14-pro'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 14', storage: '128GB', ebayQuery: 'iPhone 14 128GB', swappaSlug: 'apple-iphone-14', gazelleSlug: 'iphone-14'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 13 Pro Max', storage: '128GB', ebayQuery: 'iPhone 13 Pro Max 128GB', swappaSlug: 'apple-iphone-13-pro-max', gazelleSlug: 'iphone-13-pro-max'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 13 Pro', storage: '128GB', ebayQuery: 'iPhone 13 Pro 128GB', swappaSlug: 'apple-iphone-13-pro', gazelleSlug: 'iphone-13-pro'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 13', storage: '128GB', ebayQuery: 'iPhone 13 128GB', swappaSlug: 'apple-iphone-13', gazelleSlug: 'iphone-13'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 12 Pro Max', storage: '128GB', ebayQuery: 'iPhone 12 Pro Max 128GB', swappaSlug: 'apple-iphone-12-pro-max', gazelleSlug: 'iphone-12-pro-max'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 12 Pro', storage: '128GB', ebayQuery: 'iPhone 12 Pro 128GB', swappaSlug: 'apple-iphone-12-pro', gazelleSlug: 'iphone-12-pro'},
  {category: 'Phone', brand: 'Apple', model: 'iPhone 12', storage: '128GB', ebayQuery: 'iPhone 12 128GB', swappaSlug: 'apple-iphone-12', gazelleSlug: 'iphone-12'},

  // -----------------------------------------------------------------------
  // Samsung Galaxy S Series
  // -----------------------------------------------------------------------
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S25 Ultra', storage: '256GB', ebayQuery: 'Samsung Galaxy S25 Ultra 256GB', swappaSlug: 'samsung-galaxy-s25-ultra', gazelleSlug: 'galaxy-s25-ultra'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S25 Ultra', storage: '512GB', ebayQuery: 'Samsung Galaxy S25 Ultra 512GB', swappaSlug: 'samsung-galaxy-s25-ultra', gazelleSlug: 'galaxy-s25-ultra'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S25+', storage: '256GB', ebayQuery: 'Samsung Galaxy S25+ 256GB', swappaSlug: 'samsung-galaxy-s25-plus', gazelleSlug: 'galaxy-s25-plus'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S25', storage: '128GB', ebayQuery: 'Samsung Galaxy S25 128GB', swappaSlug: 'samsung-galaxy-s25', gazelleSlug: 'galaxy-s25'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: '256GB', ebayQuery: 'Samsung Galaxy S24 Ultra 256GB', swappaSlug: 'samsung-galaxy-s24-ultra', gazelleSlug: 'galaxy-s24-ultra'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S24 Ultra', storage: '512GB', ebayQuery: 'Samsung Galaxy S24 Ultra 512GB', swappaSlug: 'samsung-galaxy-s24-ultra', gazelleSlug: 'galaxy-s24-ultra'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S24+', storage: '256GB', ebayQuery: 'Samsung Galaxy S24+ 256GB', swappaSlug: 'samsung-galaxy-s24-plus', gazelleSlug: 'galaxy-s24-plus'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S24', storage: '128GB', ebayQuery: 'Samsung Galaxy S24 128GB', swappaSlug: 'samsung-galaxy-s24', gazelleSlug: 'galaxy-s24'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S23 Ultra', storage: '256GB', ebayQuery: 'Samsung Galaxy S23 Ultra 256GB', swappaSlug: 'samsung-galaxy-s23-ultra', gazelleSlug: 'galaxy-s23-ultra'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S23+', storage: '256GB', ebayQuery: 'Samsung Galaxy S23+ 256GB', swappaSlug: 'samsung-galaxy-s23-plus', gazelleSlug: 'galaxy-s23-plus'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy S23', storage: '128GB', ebayQuery: 'Samsung Galaxy S23 128GB', swappaSlug: 'samsung-galaxy-s23', gazelleSlug: 'galaxy-s23'},

  // -----------------------------------------------------------------------
  // Samsung Galaxy Z Series (Foldables)
  // -----------------------------------------------------------------------
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy Z Fold6', storage: '256GB', ebayQuery: 'Samsung Galaxy Z Fold6 256GB', swappaSlug: 'samsung-galaxy-z-fold-6', gazelleSlug: 'galaxy-z-fold6'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy Z Fold6', storage: '512GB', ebayQuery: 'Samsung Galaxy Z Fold6 512GB', swappaSlug: 'samsung-galaxy-z-fold-6', gazelleSlug: 'galaxy-z-fold6'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy Z Flip6', storage: '256GB', ebayQuery: 'Samsung Galaxy Z Flip6 256GB', swappaSlug: 'samsung-galaxy-z-flip-6', gazelleSlug: 'galaxy-z-flip6'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy Z Fold5', storage: '256GB', ebayQuery: 'Samsung Galaxy Z Fold5 256GB', swappaSlug: 'samsung-galaxy-z-fold-5', gazelleSlug: 'galaxy-z-fold5'},
  {category: 'Phone', brand: 'Samsung', model: 'Galaxy Z Flip5', storage: '256GB', ebayQuery: 'Samsung Galaxy Z Flip5 256GB', swappaSlug: 'samsung-galaxy-z-flip-5', gazelleSlug: 'galaxy-z-flip5'},

  // -----------------------------------------------------------------------
  // Google Pixel (6 and newer)
  // -----------------------------------------------------------------------
  {category: 'Phone', brand: 'Google', model: 'Pixel 9 Pro XL', storage: '128GB', ebayQuery: 'Google Pixel 9 Pro XL 128GB', swappaSlug: 'google-pixel-9-pro-xl', gazelleSlug: 'pixel-9-pro-xl'},
  {category: 'Phone', brand: 'Google', model: 'Pixel 9 Pro', storage: '128GB', ebayQuery: 'Google Pixel 9 Pro 128GB', swappaSlug: 'google-pixel-9-pro', gazelleSlug: 'pixel-9-pro'},
  {category: 'Phone', brand: 'Google', model: 'Pixel 9', storage: '128GB', ebayQuery: 'Google Pixel 9 128GB', swappaSlug: 'google-pixel-9', gazelleSlug: 'pixel-9'},
  {category: 'Phone', brand: 'Google', model: 'Pixel 8 Pro', storage: '128GB', ebayQuery: 'Google Pixel 8 Pro 128GB', swappaSlug: 'google-pixel-8-pro', gazelleSlug: 'pixel-8-pro'},
  {category: 'Phone', brand: 'Google', model: 'Pixel 8', storage: '128GB', ebayQuery: 'Google Pixel 8 128GB', swappaSlug: 'google-pixel-8', gazelleSlug: 'pixel-8'},
  {category: 'Phone', brand: 'Google', model: 'Pixel 7 Pro', storage: '128GB', ebayQuery: 'Google Pixel 7 Pro 128GB', swappaSlug: 'google-pixel-7-pro', gazelleSlug: 'pixel-7-pro'},
  {category: 'Phone', brand: 'Google', model: 'Pixel 7', storage: '128GB', ebayQuery: 'Google Pixel 7 128GB', swappaSlug: 'google-pixel-7', gazelleSlug: 'pixel-7'},
  {category: 'Phone', brand: 'Google', model: 'Pixel 6 Pro', storage: '128GB', ebayQuery: 'Google Pixel 6 Pro 128GB', swappaSlug: 'google-pixel-6-pro', gazelleSlug: 'pixel-6-pro'},
  {category: 'Phone', brand: 'Google', model: 'Pixel 6', storage: '128GB', ebayQuery: 'Google Pixel 6 128GB', swappaSlug: 'google-pixel-6', gazelleSlug: 'pixel-6'},

  // -----------------------------------------------------------------------
  // MacBook Pro & Air (M-series)
  // -----------------------------------------------------------------------
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Pro 16" M4 Max', storage: '1TB', ebayQuery: 'MacBook Pro 16 M4 Max 1TB', swappaSlug: 'apple-macbook-pro-16-2024-m4-max', gazelleSlug: 'macbook-pro-16-m4-max'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Pro 16" M4 Pro', storage: '512GB', ebayQuery: 'MacBook Pro 16 M4 Pro 512GB', swappaSlug: 'apple-macbook-pro-16-2024-m4-pro', gazelleSlug: 'macbook-pro-16-m4-pro'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Pro 14" M4 Pro', storage: '512GB', ebayQuery: 'MacBook Pro 14 M4 Pro 512GB', swappaSlug: 'apple-macbook-pro-14-2024-m4-pro', gazelleSlug: 'macbook-pro-14-m4-pro'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Pro 14" M4', storage: '512GB', ebayQuery: 'MacBook Pro 14 M4 512GB', swappaSlug: 'apple-macbook-pro-14-2024-m4', gazelleSlug: 'macbook-pro-14-m4'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Pro 16" M3 Max', storage: '1TB', ebayQuery: 'MacBook Pro 16 M3 Max 1TB', swappaSlug: 'apple-macbook-pro-16-2023-m3-max', gazelleSlug: 'macbook-pro-16-m3-max'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Pro 16" M3 Pro', storage: '512GB', ebayQuery: 'MacBook Pro 16 M3 Pro 512GB', swappaSlug: 'apple-macbook-pro-16-2023-m3-pro', gazelleSlug: 'macbook-pro-16-m3-pro'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Pro 14" M3 Pro', storage: '512GB', ebayQuery: 'MacBook Pro 14 M3 Pro 512GB', swappaSlug: 'apple-macbook-pro-14-2023-m3-pro', gazelleSlug: 'macbook-pro-14-m3-pro'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Air 15" M3', storage: '256GB', ebayQuery: 'MacBook Air 15 M3 256GB', swappaSlug: 'apple-macbook-air-15-2024-m3', gazelleSlug: 'macbook-air-15-m3'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Air 13" M3', storage: '256GB', ebayQuery: 'MacBook Air 13 M3 256GB', swappaSlug: 'apple-macbook-air-13-2024-m3', gazelleSlug: 'macbook-air-13-m3'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Pro 14" M2 Pro', storage: '512GB', ebayQuery: 'MacBook Pro 14 M2 Pro 512GB', swappaSlug: 'apple-macbook-pro-14-2023-m2-pro', gazelleSlug: 'macbook-pro-14-m2-pro'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Air 13" M2', storage: '256GB', ebayQuery: 'MacBook Air 13 M2 256GB', swappaSlug: 'apple-macbook-air-13-2022-m2', gazelleSlug: 'macbook-air-13-m2'},
  {category: 'Laptop', brand: 'Apple', model: 'MacBook Air M1', storage: '256GB', ebayQuery: 'MacBook Air M1 256GB', swappaSlug: 'apple-macbook-air-2020-m1', gazelleSlug: 'macbook-air-m1'},

  // -----------------------------------------------------------------------
  // Premium Windows Laptops (Dell XPS, Surface)
  // -----------------------------------------------------------------------
  {category: 'Laptop', brand: 'Dell', model: 'XPS 15 (2024)', storage: '512GB', ebayQuery: 'Dell XPS 15 2024 512GB', swappaSlug: 'dell-xps-15-9530', gazelleSlug: ''},
  {category: 'Laptop', brand: 'Dell', model: 'XPS 14 (2024)', storage: '512GB', ebayQuery: 'Dell XPS 14 2024 512GB', swappaSlug: 'dell-xps-14', gazelleSlug: ''},
  {category: 'Laptop', brand: 'Dell', model: 'XPS 13 (2024)', storage: '512GB', ebayQuery: 'Dell XPS 13 2024 512GB', swappaSlug: 'dell-xps-13-9340', gazelleSlug: ''},
  {category: 'Laptop', brand: 'Microsoft', model: 'Surface Laptop 6', storage: '256GB', ebayQuery: 'Microsoft Surface Laptop 6 256GB', swappaSlug: 'microsoft-surface-laptop-6', gazelleSlug: ''},
  {category: 'Laptop', brand: 'Microsoft', model: 'Surface Laptop 5', storage: '256GB', ebayQuery: 'Microsoft Surface Laptop 5 256GB', swappaSlug: 'microsoft-surface-laptop-5', gazelleSlug: ''},
  {category: 'Laptop', brand: 'Microsoft', model: 'Surface Pro 10', storage: '256GB', ebayQuery: 'Microsoft Surface Pro 10 256GB', swappaSlug: 'microsoft-surface-pro-10', gazelleSlug: ''},
  {category: 'Laptop', brand: 'Microsoft', model: 'Surface Pro 9', storage: '256GB', ebayQuery: 'Microsoft Surface Pro 9 256GB', swappaSlug: 'microsoft-surface-pro-9', gazelleSlug: ''},

  // -----------------------------------------------------------------------
  // iPad Pro
  // -----------------------------------------------------------------------
  {category: 'Tablet', brand: 'Apple', model: 'iPad Pro 13" M4', storage: '256GB', ebayQuery: 'iPad Pro 13 M4 256GB', swappaSlug: 'apple-ipad-pro-13-2024', gazelleSlug: 'ipad-pro-13-m4'},
  {category: 'Tablet', brand: 'Apple', model: 'iPad Pro 13" M4', storage: '512GB', ebayQuery: 'iPad Pro 13 M4 512GB', swappaSlug: 'apple-ipad-pro-13-2024', gazelleSlug: 'ipad-pro-13-m4'},
  {category: 'Tablet', brand: 'Apple', model: 'iPad Pro 11" M4', storage: '256GB', ebayQuery: 'iPad Pro 11 M4 256GB', swappaSlug: 'apple-ipad-pro-11-2024', gazelleSlug: 'ipad-pro-11-m4'},
  {category: 'Tablet', brand: 'Apple', model: 'iPad Pro 12.9" M2', storage: '128GB', ebayQuery: 'iPad Pro 12.9 M2 128GB', swappaSlug: 'apple-ipad-pro-12-9-2022', gazelleSlug: 'ipad-pro-12-9-m2'},
  {category: 'Tablet', brand: 'Apple', model: 'iPad Pro 11" M2', storage: '128GB', ebayQuery: 'iPad Pro 11 M2 128GB', swappaSlug: 'apple-ipad-pro-11-2022', gazelleSlug: 'ipad-pro-11-m2'},
  {category: 'Tablet', brand: 'Apple', model: 'iPad Air M2', storage: '128GB', ebayQuery: 'iPad Air M2 128GB', swappaSlug: 'apple-ipad-air-2024', gazelleSlug: 'ipad-air-m2'},

  // -----------------------------------------------------------------------
  // Samsung Tab S Ultra
  // -----------------------------------------------------------------------
  {category: 'Tablet', brand: 'Samsung', model: 'Galaxy Tab S10 Ultra', storage: '256GB', ebayQuery: 'Samsung Galaxy Tab S10 Ultra 256GB', swappaSlug: 'samsung-galaxy-tab-s10-ultra', gazelleSlug: ''},
  {category: 'Tablet', brand: 'Samsung', model: 'Galaxy Tab S10+', storage: '256GB', ebayQuery: 'Samsung Galaxy Tab S10+ 256GB', swappaSlug: 'samsung-galaxy-tab-s10-plus', gazelleSlug: ''},
  {category: 'Tablet', brand: 'Samsung', model: 'Galaxy Tab S9 Ultra', storage: '256GB', ebayQuery: 'Samsung Galaxy Tab S9 Ultra 256GB', swappaSlug: 'samsung-galaxy-tab-s9-ultra', gazelleSlug: ''},
  {category: 'Tablet', brand: 'Samsung', model: 'Galaxy Tab S9+', storage: '256GB', ebayQuery: 'Samsung Galaxy Tab S9+ 256GB', swappaSlug: 'samsung-galaxy-tab-s9-plus', gazelleSlug: ''},

  // -----------------------------------------------------------------------
  // Gaming Consoles
  // -----------------------------------------------------------------------
  {category: 'Console', brand: 'Sony', model: 'PlayStation 5', storage: 'Disc', ebayQuery: 'PlayStation 5 PS5 disc edition console', swappaSlug: 'sony-playstation-5', gazelleSlug: ''},
  {category: 'Console', brand: 'Sony', model: 'PlayStation 5 Digital', storage: 'Digital', ebayQuery: 'PlayStation 5 PS5 digital edition console', swappaSlug: 'sony-playstation-5-digital', gazelleSlug: ''},
  {category: 'Console', brand: 'Sony', model: 'PlayStation 5 Slim', storage: 'Disc', ebayQuery: 'PlayStation 5 Slim disc console', swappaSlug: 'sony-playstation-5-slim', gazelleSlug: ''},
  {category: 'Console', brand: 'Microsoft', model: 'Xbox Series X', storage: '1TB', ebayQuery: 'Xbox Series X 1TB console', swappaSlug: 'microsoft-xbox-series-x', gazelleSlug: ''},
  {category: 'Console', brand: 'Microsoft', model: 'Xbox Series S', storage: '512GB', ebayQuery: 'Xbox Series S console', swappaSlug: 'microsoft-xbox-series-s', gazelleSlug: ''},
  {category: 'Console', brand: 'Nintendo', model: 'Switch OLED', storage: '64GB', ebayQuery: 'Nintendo Switch OLED console', swappaSlug: 'nintendo-switch-oled', gazelleSlug: ''},

  // -----------------------------------------------------------------------
  // GPUs - NVIDIA RTX 30/40 Series
  // -----------------------------------------------------------------------
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 4090', storage: '24GB', ebayQuery: 'NVIDIA GeForce RTX 4090 24GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 4080 Super', storage: '16GB', ebayQuery: 'NVIDIA GeForce RTX 4080 Super 16GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 4080', storage: '16GB', ebayQuery: 'NVIDIA GeForce RTX 4080 16GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 4070 Ti Super', storage: '16GB', ebayQuery: 'NVIDIA GeForce RTX 4070 Ti Super', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 4070 Ti', storage: '12GB', ebayQuery: 'NVIDIA GeForce RTX 4070 Ti 12GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 4070 Super', storage: '12GB', ebayQuery: 'NVIDIA GeForce RTX 4070 Super', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 4070', storage: '12GB', ebayQuery: 'NVIDIA GeForce RTX 4070 12GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 4060 Ti', storage: '8GB', ebayQuery: 'NVIDIA GeForce RTX 4060 Ti 8GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 3090 Ti', storage: '24GB', ebayQuery: 'NVIDIA GeForce RTX 3090 Ti 24GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 3090', storage: '24GB', ebayQuery: 'NVIDIA GeForce RTX 3090 24GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 3080 Ti', storage: '12GB', ebayQuery: 'NVIDIA GeForce RTX 3080 Ti 12GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 3080', storage: '10GB', ebayQuery: 'NVIDIA GeForce RTX 3080 10GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 3070 Ti', storage: '8GB', ebayQuery: 'NVIDIA GeForce RTX 3070 Ti 8GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'NVIDIA', model: 'RTX 3070', storage: '8GB', ebayQuery: 'NVIDIA GeForce RTX 3070 8GB', swappaSlug: '', gazelleSlug: ''},

  // -----------------------------------------------------------------------
  // GPUs - AMD RX 6000/7000 Series
  // -----------------------------------------------------------------------
  {category: 'GPU', brand: 'AMD', model: 'RX 7900 XTX', storage: '24GB', ebayQuery: 'AMD Radeon RX 7900 XTX 24GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'AMD', model: 'RX 7900 XT', storage: '20GB', ebayQuery: 'AMD Radeon RX 7900 XT 20GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'AMD', model: 'RX 7800 XT', storage: '16GB', ebayQuery: 'AMD Radeon RX 7800 XT 16GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'AMD', model: 'RX 7700 XT', storage: '12GB', ebayQuery: 'AMD Radeon RX 7700 XT 12GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'AMD', model: 'RX 6950 XT', storage: '16GB', ebayQuery: 'AMD Radeon RX 6950 XT 16GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'AMD', model: 'RX 6900 XT', storage: '16GB', ebayQuery: 'AMD Radeon RX 6900 XT 16GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'AMD', model: 'RX 6800 XT', storage: '16GB', ebayQuery: 'AMD Radeon RX 6800 XT 16GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'AMD', model: 'RX 6800', storage: '16GB', ebayQuery: 'AMD Radeon RX 6800 16GB', swappaSlug: '', gazelleSlug: ''},
  {category: 'GPU', brand: 'AMD', model: 'RX 6700 XT', storage: '12GB', ebayQuery: 'AMD Radeon RX 6700 XT 12GB', swappaSlug: '', gazelleSlug: ''},

  // -----------------------------------------------------------------------
  // Apple Watch (Series 7 and newer)
  // -----------------------------------------------------------------------
  {category: 'Smartwatch', brand: 'Apple', model: 'Apple Watch Ultra 2', storage: '49mm', ebayQuery: 'Apple Watch Ultra 2 49mm', swappaSlug: 'apple-watch-ultra-2', gazelleSlug: 'apple-watch-ultra-2'},
  {category: 'Smartwatch', brand: 'Apple', model: 'Apple Watch Ultra', storage: '49mm', ebayQuery: 'Apple Watch Ultra 49mm', swappaSlug: 'apple-watch-ultra', gazelleSlug: 'apple-watch-ultra'},
  {category: 'Smartwatch', brand: 'Apple', model: 'Apple Watch Series 10', storage: '46mm', ebayQuery: 'Apple Watch Series 10 46mm', swappaSlug: 'apple-watch-series-10', gazelleSlug: 'apple-watch-series-10'},
  {category: 'Smartwatch', brand: 'Apple', model: 'Apple Watch Series 10', storage: '42mm', ebayQuery: 'Apple Watch Series 10 42mm', swappaSlug: 'apple-watch-series-10', gazelleSlug: 'apple-watch-series-10'},
  {category: 'Smartwatch', brand: 'Apple', model: 'Apple Watch Series 9', storage: '45mm', ebayQuery: 'Apple Watch Series 9 45mm', swappaSlug: 'apple-watch-series-9', gazelleSlug: 'apple-watch-series-9'},
  {category: 'Smartwatch', brand: 'Apple', model: 'Apple Watch Series 9', storage: '41mm', ebayQuery: 'Apple Watch Series 9 41mm', swappaSlug: 'apple-watch-series-9', gazelleSlug: 'apple-watch-series-9'},
  {category: 'Smartwatch', brand: 'Apple', model: 'Apple Watch Series 8', storage: '45mm', ebayQuery: 'Apple Watch Series 8 45mm', swappaSlug: 'apple-watch-series-8', gazelleSlug: 'apple-watch-series-8'},
  {category: 'Smartwatch', brand: 'Apple', model: 'Apple Watch Series 7', storage: '45mm', ebayQuery: 'Apple Watch Series 7 45mm', swappaSlug: 'apple-watch-series-7', gazelleSlug: 'apple-watch-series-7'},

  // -----------------------------------------------------------------------
  // Samsung Galaxy Watch (4 and newer)
  // -----------------------------------------------------------------------
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch Ultra', storage: '47mm', ebayQuery: 'Samsung Galaxy Watch Ultra 47mm', swappaSlug: 'samsung-galaxy-watch-ultra', gazelleSlug: ''},
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch 7', storage: '44mm', ebayQuery: 'Samsung Galaxy Watch 7 44mm', swappaSlug: 'samsung-galaxy-watch-7', gazelleSlug: ''},
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch 7', storage: '40mm', ebayQuery: 'Samsung Galaxy Watch 7 40mm', swappaSlug: 'samsung-galaxy-watch-7', gazelleSlug: ''},
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch 6 Classic', storage: '47mm', ebayQuery: 'Samsung Galaxy Watch 6 Classic 47mm', swappaSlug: 'samsung-galaxy-watch-6-classic', gazelleSlug: ''},
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch 6', storage: '44mm', ebayQuery: 'Samsung Galaxy Watch 6 44mm', swappaSlug: 'samsung-galaxy-watch-6', gazelleSlug: ''},
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch 5 Pro', storage: '45mm', ebayQuery: 'Samsung Galaxy Watch 5 Pro 45mm', swappaSlug: 'samsung-galaxy-watch-5-pro', gazelleSlug: ''},
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch 5', storage: '44mm', ebayQuery: 'Samsung Galaxy Watch 5 44mm', swappaSlug: 'samsung-galaxy-watch-5', gazelleSlug: ''},
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch 4 Classic', storage: '46mm', ebayQuery: 'Samsung Galaxy Watch 4 Classic 46mm', swappaSlug: 'samsung-galaxy-watch-4-classic', gazelleSlug: ''},
  {category: 'Smartwatch', brand: 'Samsung', model: 'Galaxy Watch 4', storage: '44mm', ebayQuery: 'Samsung Galaxy Watch 4 44mm', swappaSlug: 'samsung-galaxy-watch-4', gazelleSlug: ''}
];

// =============================================================================
// MAIN SCRAPER ORCHESTRATOR
// =============================================================================

/**
 * Run the full resale price scrape for all devices in the catalog.
 * Fetches from eBay, Swappa, and Gazelle, then aggregates into the
 * RESALE_PRICE_TRACKER sheet.
 */
function TM_runResalePriceScrape() {
  TM_showToast('Starting resale price scrape...', 'Resale Scraper', 60);
  TM_logEvent(TM_LOG_TYPES.SYNC, 'TM_runResalePriceScrape', 'Starting full resale price scrape');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let trackerSheet = ss.getSheetByName(TM_SHEETS.RESALE_PRICE_TRACKER);

    if (!trackerSheet) {
      TM_setupResalePriceTracker(ss);
      trackerSheet = ss.getSheetByName(TM_SHEETS.RESALE_PRICE_TRACKER);
    }

    const settings = TM_getSettingsMap();
    const ebayAppId = settings['EBAY_APP_ID'] || '';
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < TM_RESALE_DEVICE_CATALOG.length; i++) {
      const device = TM_RESALE_DEVICE_CATALOG[i];

      try {
        TM_showToast(
          'Scraping ' + (i + 1) + '/' + TM_RESALE_DEVICE_CATALOG.length + ': ' + device.brand + ' ' + device.model,
          'Resale Scraper', 30
        );

        const row = TM_scrapeDevicePricing(device, ebayAppId);
        results.push(row);
        successCount++;

        // Throttle requests to avoid rate limits (500ms between devices)
        if (i < TM_RESALE_DEVICE_CATALOG.length - 1) {
          Utilities.sleep(500);
        }

      } catch (e) {
        TM_logEvent(TM_LOG_TYPES.WARNING, 'TM_runResalePriceScrape',
          'Failed to scrape: ' + device.brand + ' ' + device.model,
          e.message);
        // Push a partial row with error note
        results.push(TM_createErrorRow(device, e.message));
        errorCount++;
      }
    }

    // Write results to tracker sheet
    TM_writeResaleResults(trackerSheet, results);

    const message = 'Resale scrape complete: ' + successCount + ' devices scraped, ' + errorCount + ' errors';
    TM_logEvent(TM_LOG_TYPES.SUCCESS, 'TM_runResalePriceScrape', message);
    TM_showToast(message, 'Scrape Complete', 5);

  } catch (error) {
    TM_logEvent(TM_LOG_TYPES.ERROR, 'TM_runResalePriceScrape', 'Scrape failed: ' + error.message);
    TM_showAlert('Resale scrape failed: ' + error.message);
  }
}

/**
 * Scrape a single category of devices.
 * @param {string} categoryFilter - Category to scrape (Phone, Laptop, Tablet, Console, GPU, Smartwatch)
 */
function TM_scrapeByCategory(categoryFilter) {
  TM_showToast('Scraping ' + categoryFilter + ' devices...', 'Resale Scraper', 60);

  const devices = TM_RESALE_DEVICE_CATALOG.filter(function(d) {
    return d.category === categoryFilter;
  });

  if (devices.length === 0) {
    TM_showToast('No devices found for category: ' + categoryFilter, 'Info', 5);
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let trackerSheet = ss.getSheetByName(TM_SHEETS.RESALE_PRICE_TRACKER);

  if (!trackerSheet) {
    TM_setupResalePriceTracker(ss);
    trackerSheet = ss.getSheetByName(TM_SHEETS.RESALE_PRICE_TRACKER);
  }

  const settings = TM_getSettingsMap();
  const ebayAppId = settings['EBAY_APP_ID'] || '';
  const results = [];

  for (let i = 0; i < devices.length; i++) {
    try {
      TM_showToast('Scraping ' + (i + 1) + '/' + devices.length + ': ' + devices[i].model, 'Resale Scraper', 30);
      results.push(TM_scrapeDevicePricing(devices[i], ebayAppId));
      if (i < devices.length - 1) Utilities.sleep(500);
    } catch (e) {
      results.push(TM_createErrorRow(devices[i], e.message));
    }
  }

  // Merge results with existing data (replace matching rows, keep others)
  TM_mergeResaleResults(trackerSheet, results, categoryFilter);

  TM_showToast(categoryFilter + ' scrape complete: ' + results.length + ' devices', 'Complete', 5);
}

// =============================================================================
// PER-DEVICE SCRAPING ORCHESTRATOR
// =============================================================================

/**
 * Scrape pricing from all platforms for a single device.
 * @param {Object} device - Device catalog entry
 * @param {string} ebayAppId - eBay API app ID (optional)
 * @returns {Array} Row array matching TM_HEADERS_RESALE_TRACKER
 */
function TM_scrapeDevicePricing(device, ebayAppId) {
  // Fetch from all three platforms
  const ebayData = TM_fetchEbayPricing(device.ebayQuery, ebayAppId);
  const swappaData = TM_fetchSwappaPricing(device.swappaSlug, device.model, device.storage);
  const gazelleData = TM_fetchGazellePricing(device.gazelleSlug, device.model);

  // Calculate aggregate statistics
  const allPrices = [];
  if (ebayData.avg > 0) allPrices.push(ebayData.avg);
  if (swappaData.avg > 0) allPrices.push(swappaData.avg);
  if (gazelleData.price > 0) allPrices.push(gazelleData.price);

  const sourcesFound = allPrices.length;
  let aggregateAvg = 0;
  let aggregateLow = 0;
  let aggregateHigh = 0;

  if (sourcesFound > 0) {
    aggregateAvg = Math.round(allPrices.reduce(function(sum, p) { return sum + p; }, 0) / sourcesFound);

    const allLows = [];
    const allHighs = [];
    if (ebayData.low > 0) { allLows.push(ebayData.low); allHighs.push(ebayData.high); }
    if (swappaData.low > 0) { allLows.push(swappaData.low); allHighs.push(swappaData.high); }
    if (gazelleData.price > 0) { allLows.push(gazelleData.price); allHighs.push(gazelleData.price); }

    aggregateLow = Math.min.apply(null, allLows);
    aggregateHigh = Math.max.apply(null, allHighs);
  }

  // Build row matching TM_HEADERS_RESALE_TRACKER
  return [
    new Date(),                           // Timestamp
    device.category,                      // Category
    device.brand,                         // Brand
    device.model,                         // Model
    device.storage,                       // Storage / Variant
    'Used - Good',                        // Condition (target condition for search)
    ebayData.avg || '',                   // eBay Avg Price
    ebayData.low || '',                   // eBay Low
    ebayData.high || '',                  // eBay High
    ebayData.count || 0,                  // eBay Listings Found
    swappaData.avg || '',                 // Swappa Avg Price
    swappaData.low || '',                 // Swappa Low
    swappaData.high || '',                // Swappa High
    swappaData.count || 0,                // Swappa Listings Found
    gazelleData.price || '',              // Gazelle Price
    gazelleData.condition || '',          // Gazelle Condition
    aggregateAvg || '',                   // Aggregate Avg
    aggregateLow || '',                   // Aggregate Low
    aggregateHigh || '',                  // Aggregate High
    sourcesFound,                         // Total Sources
    '',                                   // Price Trend (calculated on subsequent runs)
    new Date()                            // Last Updated
  ];
}

// =============================================================================
// EBAY SCRAPER
// =============================================================================

/**
 * Fetch recent sold/completed pricing from eBay.
 * Uses eBay Browse API if an App ID is configured, otherwise falls back
 * to scraping the eBay sold listings search page.
 * @param {string} query - Search query
 * @param {string} appId - eBay Application ID (optional)
 * @returns {Object} {avg, low, high, count}
 */
function TM_fetchEbayPricing(query, appId) {
  const result = {avg: 0, low: 0, high: 0, count: 0};

  if (!query) return result;

  try {
    if (appId) {
      return TM_fetchEbayApi(query, appId);
    }
    return TM_fetchEbaySoldListings(query);
  } catch (e) {
    TM_logEvent(TM_LOG_TYPES.WARNING, 'TM_fetchEbayPricing', 'eBay fetch failed for: ' + query, e.message);
    return result;
  }
}

/**
 * Fetch eBay pricing via the Finding API (findCompletedItems).
 * @param {string} query - Search keywords
 * @param {string} appId - eBay app ID
 * @returns {Object} {avg, low, high, count}
 */
function TM_fetchEbayApi(query, appId) {
  const result = {avg: 0, low: 0, high: 0, count: 0};

  const baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';
  const params = {
    'OPERATION-NAME': 'findCompletedItems',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    'keywords': query,
    'itemFilter(0).name': 'SoldItemsOnly',
    'itemFilter(0).value': 'true',
    'itemFilter(1).name': 'Condition',
    'itemFilter(1).value': '3000',
    'sortOrder': 'EndTimeSoonest',
    'paginationInput.entriesPerPage': '25'
  };

  const queryString = Object.keys(params).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');

  const url = baseUrl + '?' + queryString;

  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: {'Accept': 'application/json'}
  });

  if (response.getResponseCode() !== 200) return result;

  const json = JSON.parse(response.getContentText());
  const searchResult = json.findCompletedItemsResponse &&
                       json.findCompletedItemsResponse[0] &&
                       json.findCompletedItemsResponse[0].searchResult &&
                       json.findCompletedItemsResponse[0].searchResult[0];

  if (!searchResult || !searchResult.item) return result;

  const items = searchResult.item;
  const prices = [];

  items.forEach(function(item) {
    const sellingStatus = item.sellingStatus && item.sellingStatus[0];
    if (sellingStatus && sellingStatus.currentPrice) {
      const price = parseFloat(sellingStatus.currentPrice[0].__value__);
      if (price > 0) prices.push(price);
    }
  });

  return TM_calculatePriceStats(prices);
}

/**
 * Scrape eBay sold listings search results page.
 * Falls back method when no API key is configured.
 * @param {string} query - Search keywords
 * @returns {Object} {avg, low, high, count}
 */
function TM_fetchEbaySoldListings(query) {
  const result = {avg: 0, low: 0, high: 0, count: 0};

  const encodedQuery = encodeURIComponent(query);
  const url = 'https://www.ebay.com/sch/i.html?_nkw=' + encodedQuery +
              '&LH_Sold=1&LH_Complete=1&_sop=13&LH_ItemCondition=3000&_ipg=60';

  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (response.getResponseCode() !== 200) return result;

  const html = response.getContentText();
  const prices = TM_extractEbayPrices(html);

  return TM_calculatePriceStats(prices);
}

/**
 * Extract prices from eBay search results HTML.
 * @param {string} html - Raw HTML content
 * @returns {Array<number>} Array of prices
 */
function TM_extractEbayPrices(html) {
  const prices = [];

  // Match sold price patterns in eBay HTML
  // Pattern 1: s-item__price - standard sold listing price spans
  const pricePattern = /class="s-item__price"[^>]*>\s*\$([0-9,]+\.\d{2})/g;
  let match;

  while ((match = pricePattern.exec(html)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (price > 0 && price < 50000) {
      prices.push(price);
    }
  }

  // Pattern 2: Fallback - look for sold price in BOLD format
  if (prices.length === 0) {
    const altPattern = /\$([0-9,]+\.\d{2})<\/span>\s*<\/span>\s*<span[^>]*class="POSITIVE"/g;
    while ((match = altPattern.exec(html)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 0 && price < 50000) {
        prices.push(price);
      }
    }
  }

  // Pattern 3: JSON-LD structured data
  if (prices.length === 0) {
    const jsonLdPattern = /"price"\s*:\s*"?([0-9.]+)"?/g;
    while ((match = jsonLdPattern.exec(html)) !== null) {
      const price = parseFloat(match[1]);
      if (price > 10 && price < 50000) {
        prices.push(price);
      }
    }
  }

  return prices;
}

// =============================================================================
// SWAPPA SCRAPER
// =============================================================================

/**
 * Fetch pricing from Swappa for a device.
 * Scrapes the Swappa listing/pricing page for the given device slug.
 * @param {string} slug - Swappa device slug (e.g., 'apple-iphone-15-pro-max')
 * @param {string} model - Device model name for logging
 * @param {string} storage - Storage variant for filtering
 * @returns {Object} {avg, low, high, count}
 */
function TM_fetchSwappaPricing(slug, model, storage) {
  const result = {avg: 0, low: 0, high: 0, count: 0};

  if (!slug) return result;

  try {
    // Swappa's buy page shows current listings with prices
    const url = 'https://swappa.com/buy/' + slug;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (response.getResponseCode() !== 200) return result;

    const html = response.getContentText();
    const prices = TM_extractSwappaPrices(html, storage);

    return TM_calculatePriceStats(prices);

  } catch (e) {
    TM_logEvent(TM_LOG_TYPES.WARNING, 'TM_fetchSwappaPricing',
      'Swappa fetch failed for: ' + model, e.message);
    return result;
  }
}

/**
 * Extract prices from Swappa HTML.
 * @param {string} html - Raw HTML content
 * @param {string} storage - Storage variant to prefer in filtering
 * @returns {Array<number>} Array of prices
 */
function TM_extractSwappaPrices(html, storage) {
  const prices = [];

  // Pattern 1: Swappa listing price elements
  const pricePattern = /class="[^"]*price[^"]*"[^>]*>\s*\$([0-9,]+)/gi;
  let match;

  while ((match = pricePattern.exec(html)) !== null) {
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (price > 10 && price < 50000) {
      prices.push(price);
    }
  }

  // Pattern 2: data-price or value attributes
  if (prices.length === 0) {
    const dataPattern = /data-price="([0-9.]+)"/g;
    while ((match = dataPattern.exec(html)) !== null) {
      const price = parseFloat(match[1]);
      if (price > 10 && price < 50000) {
        prices.push(price);
      }
    }
  }

  // Pattern 3: JSON pricing embedded in page
  if (prices.length === 0) {
    const jsonPattern = /"price"\s*:\s*(\d+(?:\.\d+)?)/g;
    while ((match = jsonPattern.exec(html)) !== null) {
      const price = parseFloat(match[1]);
      if (price > 10 && price < 50000) {
        prices.push(price);
      }
    }
  }

  // Pattern 4: Starting at / From price
  if (prices.length === 0) {
    const startingPattern = /(?:starting at|from)\s*\$([0-9,]+)/gi;
    while ((match = startingPattern.exec(html)) !== null) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 10 && price < 50000) {
        prices.push(price);
      }
    }
  }

  return prices;
}

// =============================================================================
// GAZELLE SCRAPER
// =============================================================================

/**
 * Fetch trade-in/resale pricing from Gazelle.
 * @param {string} slug - Gazelle device slug
 * @param {string} model - Device model name for logging
 * @returns {Object} {price, condition}
 */
function TM_fetchGazellePricing(slug, model) {
  const result = {price: 0, condition: ''};

  if (!slug) return result;

  try {
    // Gazelle sell/trade-in page
    const url = 'https://www.gazelle.com/sell/' + slug;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (response.getResponseCode() !== 200) return result;

    const html = response.getContentText();
    return TM_extractGazellePricing(html);

  } catch (e) {
    TM_logEvent(TM_LOG_TYPES.WARNING, 'TM_fetchGazellePricing',
      'Gazelle fetch failed for: ' + model, e.message);
    return result;
  }
}

/**
 * Extract pricing from Gazelle HTML.
 * @param {string} html - Raw HTML content
 * @returns {Object} {price, condition}
 */
function TM_extractGazellePricing(html) {
  const result = {price: 0, condition: ''};

  // Pattern 1: Gazelle offer price elements
  var match;
  var pricePattern = /(?:get up to|value|offer|worth)\s*\$([0-9,]+)/gi;
  while ((match = pricePattern.exec(html)) !== null) {
    var price = parseFloat(match[1].replace(/,/g, ''));
    if (price > 5 && price < 50000) {
      result.price = price;
      result.condition = 'Good';
      break;
    }
  }

  // Pattern 2: data attribute prices
  if (result.price === 0) {
    var dataPattern = /data-(?:price|value|offer)="([0-9.]+)"/gi;
    while ((match = dataPattern.exec(html)) !== null) {
      var price2 = parseFloat(match[1]);
      if (price2 > 5 && price2 < 50000) {
        result.price = price2;
        result.condition = 'Good';
        break;
      }
    }
  }

  // Pattern 3: JSON pricing in page
  if (result.price === 0) {
    var jsonPattern = /"(?:price|offer|value)"\s*:\s*(\d+(?:\.\d+)?)/gi;
    while ((match = jsonPattern.exec(html)) !== null) {
      var price3 = parseFloat(match[1]);
      if (price3 > 5 && price3 < 50000) {
        result.price = price3;
        result.condition = 'Good';
        break;
      }
    }
  }

  // Pattern 4: Dollar amount in prominent elements
  if (result.price === 0) {
    var prominentPattern = /class="[^"]*(?:price|offer|value|amount)[^"]*"[^>]*>\s*\$([0-9,]+)/gi;
    while ((match = prominentPattern.exec(html)) !== null) {
      var price4 = parseFloat(match[1].replace(/,/g, ''));
      if (price4 > 5 && price4 < 50000) {
        result.price = price4;
        result.condition = 'Good';
        break;
      }
    }
  }

  return result;
}

// =============================================================================
// PRICE STATISTICS & UTILITIES
// =============================================================================

/**
 * Calculate price statistics from an array of prices.
 * Filters outliers using IQR method before computing stats.
 * @param {Array<number>} prices - Array of raw prices
 * @returns {Object} {avg, low, high, count}
 */
function TM_calculatePriceStats(prices) {
  const result = {avg: 0, low: 0, high: 0, count: 0};

  if (!prices || prices.length === 0) return result;

  // Sort prices
  prices.sort(function(a, b) { return a - b; });

  // Remove outliers using IQR if we have enough data
  var filtered = prices;
  if (prices.length >= 6) {
    var q1Index = Math.floor(prices.length * 0.25);
    var q3Index = Math.floor(prices.length * 0.75);
    var q1 = prices[q1Index];
    var q3 = prices[q3Index];
    var iqr = q3 - q1;
    var lowerBound = q1 - (1.5 * iqr);
    var upperBound = q3 + (1.5 * iqr);

    filtered = prices.filter(function(p) {
      return p >= lowerBound && p <= upperBound;
    });

    // Ensure we kept at least some prices
    if (filtered.length === 0) filtered = prices;
  }

  result.count = filtered.length;
  result.low = Math.round(filtered[0]);
  result.high = Math.round(filtered[filtered.length - 1]);
  result.avg = Math.round(filtered.reduce(function(sum, p) { return sum + p; }, 0) / filtered.length);

  return result;
}

/**
 * Create an error row for a device that failed to scrape.
 * @param {Object} device - Device catalog entry
 * @param {string} errorMsg - Error message
 * @returns {Array} Row array with error info
 */
function TM_createErrorRow(device, errorMsg) {
  return [
    new Date(),
    device.category,
    device.brand,
    device.model,
    device.storage,
    '',
    '', '', '', 0,
    '', '', '', 0,
    '', '',
    '', '', '',
    0,
    'ERROR: ' + errorMsg,
    new Date()
  ];
}

// =============================================================================
// SHEET WRITING & MERGING
// =============================================================================

/**
 * Write all resale results to the tracker sheet (full refresh).
 * @param {Sheet} trackerSheet - The RESALE_PRICE_TRACKER sheet
 * @param {Array} results - Array of row arrays
 */
function TM_writeResaleResults(trackerSheet, results) {
  if (results.length === 0) return;

  // Calculate price trends before overwriting
  var existingData = [];
  if (trackerSheet.getLastRow() > 1) {
    existingData = TM_sheetToObjects(trackerSheet);
  }

  // Add trend data
  results = results.map(function(row) {
    var trend = TM_calculatePriceTrend(row, existingData);
    row[20] = trend; // Price Trend column
    return row;
  });

  // Clear existing data (keep headers)
  if (trackerSheet.getLastRow() > 1) {
    trackerSheet.getRange(2, 1, trackerSheet.getLastRow() - 1, trackerSheet.getLastColumn())
                .clearContent();
  }

  // Write new data
  trackerSheet.getRange(2, 1, results.length, results[0].length).setValues(results);

  // Apply number formatting for price columns
  var priceColumns = [7, 8, 9, 11, 12, 13, 15, 17, 18, 19]; // 1-indexed price columns
  priceColumns.forEach(function(col) {
    trackerSheet.getRange(2, col, results.length, 1).setNumberFormat('$#,##0.00');
  });
}

/**
 * Merge results for a specific category into existing tracker data.
 * Replaces rows matching the given category, keeps everything else.
 * @param {Sheet} trackerSheet - The RESALE_PRICE_TRACKER sheet
 * @param {Array} newResults - New results for the category
 * @param {string} category - Category being updated
 */
function TM_mergeResaleResults(trackerSheet, newResults, category) {
  var existingData = [];
  if (trackerSheet.getLastRow() > 1) {
    var range = trackerSheet.getRange(2, 1, trackerSheet.getLastRow() - 1, trackerSheet.getLastColumn());
    existingData = range.getValues();
  }

  // Keep rows from other categories
  var keptRows = existingData.filter(function(row) {
    return row[1] !== category; // Column index 1 = Category
  });

  // Combine with new results
  var allRows = keptRows.concat(newResults);

  // Clear and rewrite
  if (trackerSheet.getLastRow() > 1) {
    trackerSheet.getRange(2, 1, trackerSheet.getLastRow() - 1, trackerSheet.getLastColumn())
                .clearContent();
  }

  if (allRows.length > 0) {
    trackerSheet.getRange(2, 1, allRows.length, allRows[0].length).setValues(allRows);

    // Apply number formatting for price columns
    var priceColumns = [7, 8, 9, 11, 12, 13, 15, 17, 18, 19];
    priceColumns.forEach(function(col) {
      trackerSheet.getRange(2, col, allRows.length, 1).setNumberFormat('$#,##0.00');
    });
  }
}

/**
 * Calculate price trend based on previous scrape data.
 * Compares new aggregate avg with previous aggregate avg.
 * @param {Array} newRow - New data row
 * @param {Array} existingData - Previous scrape data as objects
 * @returns {string} Trend indicator
 */
function TM_calculatePriceTrend(newRow, existingData) {
  if (!existingData || existingData.length === 0) return 'NEW';

  var brand = newRow[2];
  var model = newRow[3];
  var storage = newRow[4];
  var newAvg = newRow[16]; // Aggregate Avg

  if (!newAvg || newAvg === '') return 'N/A';

  // Find matching previous entry
  var prev = existingData.find(function(d) {
    return d['Brand'] === brand && d['Model'] === model && d['Storage / Variant'] === storage;
  });

  if (!prev) return 'NEW';

  var prevAvg = parseFloat(prev['Aggregate Avg']);
  if (isNaN(prevAvg) || prevAvg === 0) return 'N/A';

  var change = ((newAvg - prevAvg) / prevAvg) * 100;

  if (change > 5) return 'UP +' + Math.round(change) + '%';
  if (change < -5) return 'DOWN ' + Math.round(change) + '%';
  return 'STABLE';
}

// =============================================================================
// CONVENIENCE SCRAPE FUNCTIONS (for menu & UI)
// =============================================================================

/** Scrape only Phones */
function TM_scrapePhones() { TM_scrapeByCategory('Phone'); }

/** Scrape only Laptops */
function TM_scrapeLaptops() { TM_scrapeByCategory('Laptop'); }

/** Scrape only Tablets */
function TM_scrapeTablets() { TM_scrapeByCategory('Tablet'); }

/** Scrape only Gaming Consoles */
function TM_scrapeConsoles() { TM_scrapeByCategory('Console'); }

/** Scrape only GPUs */
function TM_scrapeGpus() { TM_scrapeByCategory('GPU'); }

/** Scrape only Smartwatches */
function TM_scrapeSmartWatches() { TM_scrapeByCategory('Smartwatch'); }

// =============================================================================
// RESALE PRICE TRACKER SHEET SETUP
// =============================================================================

/**
 * Setup the RESALE_PRICE_TRACKER sheet.
 * @param {Spreadsheet} ss - The spreadsheet
 */
function TM_setupResalePriceTracker(ss) {
  let sheet = ss.getSheetByName(TM_SHEETS.RESALE_PRICE_TRACKER);

  if (!sheet) {
    sheet = ss.insertSheet(TM_SHEETS.RESALE_PRICE_TRACKER);
  }

  // Set headers
  TM_ensureHeaders(sheet, TM_HEADERS_RESALE_TRACKER);

  // Format header
  const headerRange = sheet.getRange(1, 1, 1, TM_HEADERS_RESALE_TRACKER.length);
  headerRange.setBackground('#00695c');
  headerRange.setFontColor(TM_COLORS.HEADER_TEXT);
  headerRange.setFontWeight('bold');

  // Set column widths
  sheet.setColumnWidth(1, 140);   // Timestamp
  sheet.setColumnWidth(2, 100);   // Category
  sheet.setColumnWidth(3, 100);   // Brand
  sheet.setColumnWidth(4, 220);   // Model
  sheet.setColumnWidth(5, 100);   // Storage/Variant
  sheet.setColumnWidth(6, 100);   // Condition
  sheet.setColumnWidth(7, 100);   // eBay Avg
  sheet.setColumnWidth(8, 80);    // eBay Low
  sheet.setColumnWidth(9, 80);    // eBay High
  sheet.setColumnWidth(10, 60);   // eBay Count
  sheet.setColumnWidth(11, 100);  // Swappa Avg
  sheet.setColumnWidth(12, 80);   // Swappa Low
  sheet.setColumnWidth(13, 80);   // Swappa High
  sheet.setColumnWidth(14, 60);   // Swappa Count
  sheet.setColumnWidth(15, 100);  // Gazelle Price
  sheet.setColumnWidth(16, 100);  // Gazelle Condition
  sheet.setColumnWidth(17, 100);  // Aggregate Avg
  sheet.setColumnWidth(18, 80);   // Aggregate Low
  sheet.setColumnWidth(19, 80);   // Aggregate High
  sheet.setColumnWidth(20, 60);   // Total Sources
  sheet.setColumnWidth(21, 120);  // Price Trend
  sheet.setColumnWidth(22, 140);  // Last Updated

  // Apply alternating colors
  TM_applyAlternatingColors(sheet, TM_HEADERS_RESALE_TRACKER.length);

  // Freeze header
  sheet.setFrozenRows(1);
}

// =============================================================================
// RESALE SCRAPER UI FUNCTIONS
// =============================================================================

/**
 * Run resale scrape from UI button.
 * @returns {Object} Result
 */
function TM_runResaleScrapeFromUi() {
  try {
    TM_runResalePriceScrape();
    return {success: true, message: 'Resale price scrape completed successfully'};
  } catch (error) {
    return {success: false, message: error.message};
  }
}

/**
 * Scrape a specific category from UI.
 * @param {string} category - Category to scrape
 * @returns {Object} Result
 */
function TM_scrapeCategoryFromUi(category) {
  try {
    TM_scrapeByCategory(category);
    return {success: true, message: category + ' scrape completed successfully'};
  } catch (error) {
    return {success: false, message: error.message};
  }
}

/**
 * Get the current resale tracker summary for dashboard display.
 * @returns {Object} Summary stats by category
 */
function TM_getResaleTrackerSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TM_SHEETS.RESALE_PRICE_TRACKER);

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      totalDevices: 0,
      categories: {},
      lastUpdated: null,
      topValueDevices: []
    };
  }

  const data = TM_sheetToObjects(sheet);
  const categories = {};
  var lastUpdated = null;
  var topDevices = [];

  data.forEach(function(row) {
    var cat = row['Category'] || 'Unknown';
    if (!categories[cat]) {
      categories[cat] = {count: 0, avgPrice: 0, totalPrice: 0};
    }
    categories[cat].count++;

    var avg = parseFloat(row['Aggregate Avg']);
    if (!isNaN(avg) && avg > 0) {
      categories[cat].totalPrice += avg;
      topDevices.push({
        name: row['Brand'] + ' ' + row['Model'] + ' ' + row['Storage / Variant'],
        avgPrice: avg,
        trend: row['Price Trend'] || ''
      });
    }

    var updated = row['Last Updated'];
    if (updated && (!lastUpdated || updated > lastUpdated)) {
      lastUpdated = updated;
    }
  });

  // Calculate category averages
  for (var cat in categories) {
    if (categories[cat].count > 0) {
      categories[cat].avgPrice = Math.round(categories[cat].totalPrice / categories[cat].count);
    }
  }

  // Sort top devices by price descending
  topDevices.sort(function(a, b) { return b.avgPrice - a.avgPrice; });

  return {
    totalDevices: data.length,
    categories: categories,
    lastUpdated: lastUpdated,
    topValueDevices: topDevices.slice(0, 10)
  };
}

/**
 * Get resale data for a specific device to aid buyback analysis.
 * Used by the analysis engine to cross-reference market pricing.
 * @param {string} brand - Device brand
 * @param {string} model - Device model
 * @param {string} storage - Storage/variant
 * @returns {Object|null} Resale pricing data or null if not found
 */
function TM_getResalePricingForDevice(brand, model, storage) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TM_SHEETS.RESALE_PRICE_TRACKER);

  if (!sheet || sheet.getLastRow() < 2) return null;

  const data = TM_sheetToObjects(sheet);

  // Try exact match first
  var match = data.find(function(row) {
    return row['Brand'] === brand && row['Model'] === model && row['Storage / Variant'] === storage;
  });

  // Try fuzzy match (same brand/model, any storage)
  if (!match) {
    match = data.find(function(row) {
      return row['Brand'] === brand && row['Model'] === model;
    });
  }

  if (!match) return null;

  return {
    ebayAvg: parseFloat(match['eBay Avg Price']) || 0,
    ebayLow: parseFloat(match['eBay Low']) || 0,
    ebayHigh: parseFloat(match['eBay High']) || 0,
    swappaAvg: parseFloat(match['Swappa Avg Price']) || 0,
    swappaLow: parseFloat(match['Swappa Low']) || 0,
    swappaHigh: parseFloat(match['Swappa High']) || 0,
    gazellePrice: parseFloat(match['Gazelle Price']) || 0,
    aggregateAvg: parseFloat(match['Aggregate Avg']) || 0,
    aggregateLow: parseFloat(match['Aggregate Low']) || 0,
    aggregateHigh: parseFloat(match['Aggregate High']) || 0,
    trend: match['Price Trend'] || '',
    lastUpdated: match['Last Updated'] || ''
  };
}
