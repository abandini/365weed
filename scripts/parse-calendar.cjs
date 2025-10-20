#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Parse markdown calendar files and generate SQL seed data
 */

function parseCalendarMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const entries = [];

  let inTable = false;

  for (const line of lines) {
    // Skip headers, dividers, and empty lines
    if (line.startsWith('##') || line.startsWith('---') || line.trim() === '' || line.startsWith('#')) {
      continue;
    }

    // Check if we're in a table
    if (line.includes('| **') || (line.startsWith('|') && line.includes('2025') || line.includes('2026'))) {
      inTable = true;

      // Parse table row
      const parts = line.split('|').map(p => p.trim()).filter(p => p);

      if (parts.length >= 4) {
        const dateMatch = parts[0].match(/([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})/);

        if (dateMatch) {
          const [, monthAbbr, day, year] = dateMatch;
          const monthMap = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };

          const date = `${year}-${monthMap[monthAbbr]}-${day.padStart(2, '0')}`;
          const theme = parts[1].replace(/\*\*/g, '');
          const dailyItem = parts[2].replace(/\*\*/g, '');
          const contentSnippet = parts[3].replace(/\*\*/g, '');
          const appIntegration = parts.length > 4 ? parts[4].replace(/\*\*/g, '') : '';

          // Generate slug from daily item
          const slug = dailyItem
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

          // Combine content
          const body = `${contentSnippet}\n\n${appIntegration}`;

          // Extract tags from theme
          const tags = theme.toLowerCase().replace(/\s/g, ',');

          entries.push({
            date,
            slug,
            title: dailyItem,
            body_md: body,
            tags,
            theme
          });
        }
      }
    }
  }

  return entries;
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function escapeSQL(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

function generateSQL(entries) {
  const sql = [];

  sql.push('-- Auto-generated calendar content seed data');
  sql.push('-- Generated: ' + new Date().toISOString());
  sql.push('');

  // Delete existing content first
  sql.push('DELETE FROM day_cards;');
  sql.push('');

  for (const entry of entries) {
    const spotlight = JSON.stringify({
      theme: entry.theme,
      category: entry.theme.split(' ')[0].toLowerCase()
    });

    const hero_url = `https://images.unsplash.com/photo-1587155901009-71a1add59df2?w=800`;

    sql.push(
      `INSERT INTO day_cards (date, slug, title, body_md, spotlight_json, tags, hero_url) VALUES` +
      `\n  ('${entry.date}', '${escapeSQL(entry.slug)}', '${escapeSQL(entry.title)}', ` +
      `'${escapeSQL(entry.body_md)}', '${escapeSQL(spotlight)}', '${escapeSQL(entry.tags)}', '${hero_url}');`
    );
  }

  return sql.join('\n');
}

// Main execution
try {
  console.log('Parsing calendar files...');

  const file1 = path.join(__dirname, '..', 'complete_daily_content_calendar_2025-2026.md');
  const file2 = path.join(__dirname, '..', 'daily_content_calendar_2026_extended.md');

  const entries1 = parseCalendarMarkdown(file1);
  const entries2 = parseCalendarMarkdown(file2);

  console.log(`Parsed ${entries1.length} entries from file 1`);
  console.log(`Parsed ${entries2.length} entries from file 2`);

  // Combine and deduplicate by date
  const allEntries = [...entries1, ...entries2];
  const uniqueEntries = [];
  const seenDates = new Set();

  for (const entry of allEntries) {
    if (!seenDates.has(entry.date)) {
      seenDates.add(entry.date);
      uniqueEntries.push(entry);
    }
  }

  // Sort by date
  uniqueEntries.sort((a, b) => a.date.localeCompare(b.date));

  console.log(`Total unique entries: ${uniqueEntries.length}`);
  console.log(`Date range: ${uniqueEntries[0]?.date} to ${uniqueEntries[uniqueEntries.length - 1]?.date}`);

  // Generate SQL
  const sql = generateSQL(uniqueEntries);

  // Write to file
  const outputPath = path.join(__dirname, '..', 'worker', 'seed', 'calendar-content.sql');
  fs.writeFileSync(outputPath, sql, 'utf-8');

  console.log(`✅ Generated SQL seed file: ${outputPath}`);
  console.log(`📅 ${uniqueEntries.length} days of content ready to deploy`);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
