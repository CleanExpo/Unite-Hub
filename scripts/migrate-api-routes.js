import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, '../src/app/api');
const AUTH_HELPER_PATH = '@/lib/supabase/apiAuth';

async function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Replace createRouteHandlerClient imports
  let newContent = content.replace(
    /import \{ createRouteHandlerClient \} from ['"]@supabase\/auth-helpers-nextjs['"]/g,
    `import { withApiAuth } from '${AUTH_HELPER_PATH}';`
  );
  
  // Remove cookies import
  newContent = newContent.replace(
    /import \{ cookies \} from ['"]next\/headers['"];?\n?/g,
    ''
  );
  
  // Replace route handlers with withApiAuth pattern
  newContent = newContent.replace(
    /export async function (GET|POST|PUT|DELETE|PATCH)\(.*?\) \{[\s\S]*?\n\}/g,
    (match, method) => {
      return `async function handle${method}(req, userId) ${match.replace(
        `export async function ${method}(`,
        '('
      )}`;
    }
  );
  
  // Add export statements at end
  if (newContent.includes('handleGET')) {
    newContent += '\nexport const GET = withApiAuth(handleGET);';
  }
  if (newContent.includes('handlePOST')) {
    newContent += '\nexport const POST = withApiAuth(handlePOST);';
  }
  if (newContent.includes('handlePUT')) {
    newContent += '\nexport const PUT = withApiAuth(handlePUT);';
  }
  if (newContent.includes('handleDELETE')) {
    newContent += '\nexport const DELETE = withApiAuth(handleDELETE);';
  }
  if (newContent.includes('handlePATCH')) {
    newContent += '\nexport const PATCH = withApiAuth(handlePATCH);';
  }
  
  // Remove old supabase auth code
  newContent = newContent.replace(
    /const supabase = createRouteHandlerClient\(\{ cookies \}\);\s+const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);\s+if \(!user\) \{.*?\}/gs,
    ''
  );
  
  // Add await to createClient calls
  newContent = newContent.replace(
    /const supabase = createClient\(\);/g,
    'const supabase = await createClient();'
  );
  
  return newContent;
}

async function migrateDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      await migrateDirectory(fullPath);
    } else if (file === 'route.ts') {
      console.log(`Migrating ${fullPath}`);
      const migrated = await migrateFile(fullPath);
      fs.writeFileSync(fullPath, migrated);
    }
  }
}

// Run migration
await migrateDirectory(API_DIR);
console.log('API routes migration complete!');
