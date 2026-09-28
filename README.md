# Abha Visitor Guide

## What it does

A polished, single-page guide to 24 handpicked dining, cafe, heritage, market, nature, and activity locations in Abha and Aseer. The dual-side header lets you choose a month for its Modern Aseer & Al-Qatt Al-Asiri palette, hero story, atmospheric effects, featured experiences, and matching places—or choose a category to see every matching place across the full year. Open a location in Google Maps, generate an easy four-stop day, or use **Surprise me** to discover a random place.

## Who it is for

Curious visitors who want a simple, visual starting point for exploring Abha's highland views, natural spaces, arts, heritage, and markets.

## Needs

A modern web browser. No installation, account, server, or internet connection is needed to browse the guide. Internet is only used after a visitor deliberately opens a Google Maps link or an image fallback's Unsplash link.

## How to run it

Double-click `index.html` to open the guide in a browser. It runs directly from the folder without a build step or server.

To add real local photos, place files named `place1.jpg` through `place24.jpg` inside `images/`. Until then, each card intentionally shows a visible fallback with an optional Unsplash link.

## Try it with the sample data

The built-in made-up guide data, monthly descriptions, featured destinations, and year-round recommendations live in `sample-data/data.js` and are loaded by a script tag so the guide also works when `index.html` is opened directly. Use **Load example guide** at the bottom of the page to restore the current month and a sample itinerary.

The browser may save only your selected filters and generated itinerary IDs in localStorage. Nothing you type or choose is sent to GitHub.

### Features

- Twenty-four English-language places across Abha and Aseer
- Exact categories: All, Dining, Cafes, Heritage & Markets, Nature, and Activities
- A dual-side header: global category filters on the left and twelve touch-friendly month tabs on the right
- Five global category filters that show every matching record across the year; **All / month** restores the selected month's available places
- Twelve dynamic monthly themes with distinct hero titles, subtitles, Al-Qatt-inspired palettes, and CSS-only mist, cloud, or rain details
- Three featured experiences and a permanent All Year Round restaurant and cafe recommendation section that return in **All / month** view
- CSS-generated Al-Qatt Al-Asiri-inspired diamonds, triangles, parallel lines, and corner frames; no remote fonts, scripts, image embeds, or libraries required for the design system
- Google Maps search buttons for every catalog place
- **Plan My Day** route generator and **Surprise me** picker that use the current month or full-year category result set
- Keyboard focus styles, responsive cards, and reduced-motion support
- Locally generated Aseer-inspired design; no remote fonts, scripts, image embeds, or APIs

Built with Claude Code during the KKU Claude Code hackathon

Started on 2026-09-27
