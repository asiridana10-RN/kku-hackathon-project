# Abha Visitor Guide

## What it does

A polished, single-page guide to 19 handpicked dining, cafe, heritage, market, nature, and activity locations in Abha and Aseer. The dual-side header lets you choose a month for its Modern Aseer palette, hero story, atmospheric effects, featured experiences, and matching places—or choose a category to see every matching place across the full year. Open a location in Google Maps, generate an easy four-stop day, or use **Surprise me** to discover a random place.

## Who it is for

Curious visitors who want a simple, visual starting point for exploring Abha's highland views, natural spaces, arts, heritage, and markets.

## Needs

A modern web browser. No installation, account, server, or internet connection is needed to browse the guide. Internet is only used after a visitor deliberately opens a Google Maps link or an image fallback's Unsplash link.

## How to run it

Double-click `index.html` to open the guide in a browser. It runs directly from the folder without a build step or server.

To add or replace a local photo, save it inside `images/` and update the matching record's `image` path in `sample-data/data.js`. Until a matching photo is available, its card intentionally shows a clean visible fallback with an optional Unsplash link.

## Try it with the sample data

The built-in made-up guide data, monthly descriptions, featured destinations, and year-round recommendations live in `sample-data/data.js` and are loaded by a script tag so the guide also works when `index.html` is opened directly. Use **Load example guide** at the bottom of the page to restore the current month and a sample itinerary.

The browser may save only your selected filters and active curated day in localStorage. Nothing you type or choose is sent to GitHub.

### Features

- Nineteen English-language places across Abha and Aseer
- Exact categories: All, Dining, Cafes, Heritage & Markets, Nature, and Activities
- A dual-side header: global category filters on the left and twelve touch-friendly month tabs on the right
- Five global category filters that show every matching record across the year; **All / month** restores the selected month's available places
- A warm clay-and-paper Al-Qatt Al-Asiri design system across the whole guide, with twelve dynamic monthly hero stories and subtle full-screen CSS-only clouds, sunshine, rain, or Jacaranda petals
- Three featured experiences and a permanent All Year Round restaurant and cafe recommendation section that return in **All / month** view
- Clean, locally generated seasonal styling with no remote fonts, scripts, image embeds, or libraries required for the design system
- Google Maps search buttons for every catalog place
- Five fixed curated day itineraries with local-photo stops; **Make another route** advances through Days 1–5 and loops back to Day 1, while **Surprise me** uses the current month or full-year category result set
- Keyboard focus styles, responsive cards, and reduced-motion support
- Locally generated Aseer-inspired design; no remote fonts, scripts, image embeds, or APIs

Built with Claude Code during the KKU Claude Code hackathon

Started on 2026-09-27
