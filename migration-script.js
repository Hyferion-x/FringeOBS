#!/usr/bin/env node

/**
 * Migration Script for Vercel Deployment
 * Automatically updates all hardcoded Azure URLs to use centralized API configuration
 */

const fs = require('fs');
const path = require('path');

// Define the mapping of old URLs to new API_ENDPOINTS
const urlMappings = [
  // Authentication endpoints
  {
    old: "http://20.42.209.232:5002/api/auth/login",
    new: "API_ENDPOINTS.AUTH.LOGIN"
  },
  {
    old: "http://20.42.209.232:5002/api/users/register",
    new: "API_ENDPOINTS.AUTH.REGISTER"
  },
  {
    old: "http://20.42.209.232:5002/api/auth/profile",
    new: "API_ENDPOINTS.AUTH.PROFILE"
  },
  {
    old: "http://20.42.209.232:5002/api/auth/google",
    new: "API_ENDPOINTS.AUTH.GOOGLE"
  },
  {
    old: "http://20.42.209.232:5002/api/auth/all",
    new: "API_ENDPOINTS.AUTH.ALL_USERS"
  },
  {
    old: "http://20.42.209.232:5002/api/auth/profile/password",
    new: "API_ENDPOINTS.AUTH.UPDATE_PASSWORD"
  },
  
  // Events endpoints
  {
    old: "http://20.42.209.232:5002/api/events",
    new: "API_ENDPOINTS.EVENTS.BASE"
  },
  {
    old: "http://20.42.209.232:5002/api/events/contact-messages",
    new: "API_ENDPOINTS.EVENTS.CONTACT_MESSAGES"
  },
  
  // Cart endpoints
  {
    old: "http://20.42.209.232:5002/api/cart",
    new: "API_ENDPOINTS.CART.BASE"
  },
  {
    old: "http://20.42.209.232:5002/api/cart/add",
    new: "API_ENDPOINTS.CART.ADD"
  },
  {
    old: "http://20.42.209.232:5002/api/cart/update",
    new: "API_ENDPOINTS.CART.UPDATE"
  },
  {
    old: "http://20.42.209.232:5002/api/cart/remove",
    new: "API_ENDPOINTS.CART.REMOVE"
  },
  {
    old: "http://20.42.209.232:5002/api/cart/clear",
    new: "API_ENDPOINTS.CART.CLEAR"
  },
  
  // Payment endpoints
  {
    old: "http://20.42.209.232:5002/api/payments/create-checkout-session",
    new: "API_ENDPOINTS.PAYMENTS.CREATE_SESSION"
  },
  {
    old: "http://20.42.209.232:5002/api/payments/verify-and-create-orders",
    new: "API_ENDPOINTS.PAYMENTS.VERIFY_ORDERS"
  },
  
  // Merchandise endpoints
  {
    old: "http://20.42.209.232:5002/api/merchandise",
    new: "API_ENDPOINTS.MERCHANDISE.BASE"
  },
  
  // Order endpoints
  {
    old: "http://20.42.209.232:5002/api/shopOrders",
    new: "API_ENDPOINTS.ORDERS.SHOP"
  },
  {
    old: "http://20.42.209.232:5002/api/shopOrders/all",
    new: "API_ENDPOINTS.ORDERS.SHOP_ALL"
  },
  {
    old: "http://20.42.209.232:5002/api/ticketorders",
    new: "API_ENDPOINTS.ORDERS.TICKETS"
  },
  {
    old: "http://20.42.209.232:5002/api/ticketOrders/admin",
    new: "API_ENDPOINTS.ORDERS.TICKETS_ADMIN"
  },
  
  // Booking endpoints
  {
    old: "http://20.42.209.232:5002/api/bookings",
    new: "API_ENDPOINTS.BOOKINGS.BASE"
  },
  
  // Notification endpoints
  {
    old: "http://20.42.209.232:5002/api/notifications",
    new: "API_ENDPOINTS.NOTIFICATIONS.BASE"
  },
  
  // Contact endpoints
  {
    old: "http://20.42.209.232:5002/api/contactMessages",
    new: "API_ENDPOINTS.CONTACT.MESSAGES"
  },
  
  // Users endpoints
  {
    old: "http://20.42.209.232:5002/api/users/all",
    new: "API_ENDPOINTS.USERS.ALL"
  }
];

// Dynamic URL patterns that need special handling
const dynamicPatterns = [
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/events\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.EVENTS.BY_ID($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/events\/expected-sales\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.EVENTS.EXPECTED_SALES($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/merchandise\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.MERCHANDISE.BY_ID($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/shopOrders\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.ORDERS.SHOP_BY_ID($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/ticketorders\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.ORDERS.TICKETS_BY_ID($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/bookings\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.BOOKINGS.BY_ID($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/notifications\/(\${[^}]+}|\w+)\/read/g,
    replacement: "API_ENDPOINTS.NOTIFICATIONS.READ($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/notifications\/(\${[^}]+}|\w+)\/unread/g,
    replacement: "API_ENDPOINTS.NOTIFICATIONS.UNREAD($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/notifications\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.NOTIFICATIONS.DELETE($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/events\/contact-messages\/(\${[^}]+}|\w+)\/read/g,
    replacement: "API_ENDPOINTS.CONTACT.MARK_READ($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/events\/contact-messages\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.CONTACT.DELETE($1)"
  },
  {
    pattern: /http:\/\/20\.42\.209\.232:5002\/api\/users\/(\${[^}]+}|\w+)/g,
    replacement: "API_ENDPOINTS.USERS.BY_ID($1)"
  }
];

// Frontend URL redirects
const frontendUrlMappings = [
  {
    old: "http://20.42.209.232:3002/success?session_id={CHECKOUT_SESSION_ID}",
    new: "${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}"
  },
  {
    old: "http://20.42.209.232:3002/cancel",
    new: "${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'}/cancel"
  },
  {
    old: "http://20.42.209.232:3002/login?token=${token}",
    new: "${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'}/login?token=${token}"
  }
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Check if file already imports API_ENDPOINTS
    const hasApiImport = content.includes('API_ENDPOINTS') || content.includes('./config/api');
    
    // Add import statement if needed and file is a JS/JSX file
    if (!hasApiImport && (filePath.endsWith('.js') || filePath.endsWith('.jsx')) && 
        content.includes('20.42.209.232:5002')) {
      
      // Find the last import statement
      const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?\s*\n/g;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
        
        const apiImport = "// Updated for Vercel deployment - using centralized API configuration\nimport { API_ENDPOINTS, apiCall } from './config/api';\n";
        content = content.slice(0, lastImportIndex) + apiImport + content.slice(lastImportIndex);
        hasChanges = true;
      }
    }
    
    // Apply simple URL mappings
    urlMappings.forEach(mapping => {
      const oldContent = content;
      content = content.replace(new RegExp(escapeRegExp(mapping.old), 'g'), mapping.new);
      if (oldContent !== content) {
        hasChanges = true;
        console.log(`  ✓ Replaced ${mapping.old} with ${mapping.new}`);
      }
    });
    
    // Apply dynamic patterns
    dynamicPatterns.forEach(pattern => {
      const oldContent = content;
      content = content.replace(pattern.pattern, pattern.replacement);
      if (oldContent !== content) {
        hasChanges = true;
        console.log(`  ✓ Applied dynamic pattern replacement`);
      }
    });
    
    // Apply frontend URL mappings for backend files
    if (filePath.includes('backend') || filePath.includes('routes')) {
      frontendUrlMappings.forEach(mapping => {
        const oldContent = content;
        content = content.replace(new RegExp(escapeRegExp(mapping.old), 'g'), mapping.new);
        if (oldContent !== content) {
          hasChanges = true;
          console.log(`  ✓ Updated frontend URL: ${mapping.old}`);
        }
      });
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processDirectory(dirPath, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const files = fs.readdirSync(dirPath);
  let updatedCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      updatedCount += processDirectory(fullPath, extensions);
    } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
      if (updateFile(fullPath)) {
        updatedCount++;
      }
    }
  });
  
  return updatedCount;
}

// Main execution
console.log('🚀 Starting Vercel migration: Updating hardcoded URLs...\n');

const clientDir = path.join(__dirname, 'fringe-client', 'src');
const backendDir = path.join(__dirname, 'fringe-backend');

let totalUpdated = 0;

if (fs.existsSync(clientDir)) {
  console.log('📁 Processing frontend files...');
  totalUpdated += processDirectory(clientDir, ['.js', '.jsx']);
}

if (fs.existsSync(backendDir)) {
  console.log('\n📁 Processing backend files...');
  totalUpdated += processDirectory(backendDir, ['.js']);
}

console.log(`\n✅ Migration complete! Updated ${totalUpdated} files.`);
console.log('\n📋 Next steps:');
console.log('1. Set environment variables in Vercel dashboard');
console.log('2. Update backend redirect URLs to use environment variables');
console.log('3. Test all functionality after deployment');
console.log('4. Update DNS settings to point to Vercel'); 