'use server'

import { createClient } from '@/utils/supabase/server'
import * as cheerio from 'cheerio'

function isValidUrl(urlString: string) {
    try {
        const url = new URL(urlString);
        // Only allow http and https protocols
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return false;
        }

        // Extremely basic SSRF protection: block localhost and common local IP patterns
        // In a true production app, you would use a dedicated library or robust regex for SSRF protection
        const hostname = url.hostname.toLowerCase();
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '::1' ||
            hostname.startsWith('10.') ||
            hostname.startsWith('192.168.') ||
            (hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./))
        ) {
            return false;
        }
        return true;
    } catch {
        return false; // Invalid URL format
    }
}

export async function fetchMetadata(url: string) {
    // Authenticate the request to prevent abuse
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null;
    }

    if (!isValidUrl(url)) {
        console.error("Invalid or restricted URL provided for metadata fetching.");
        return null;
    }

    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Cache for an hour
            headers: {
                // Some websites block requests without a user agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (!response.ok) {
            return null
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Try og:title first, then title tag
        let title = $('meta[property="og:title"]').attr('content')
        if (!title) {
            title = $('title').text()
        }

        return title ? title.trim() : null
    } catch (error) {
        console.error("Failed to fetch metadata:", error)
        return null
    }
}
