# Abha Visitor Guide

## What it does

A polished, single-page guide to 24 handpicked dining, cafe, heritage, market, nature, and activity locations in Abha and Aseer. Choose a month to see its local guide, featured destinations, and matching places; filter by category, open a location in Google Maps, generate an easy four-stop day, or use **Surprise me** to discover a random place.

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
- Twelve month guides with dedicated descriptions and three featured destinations each
- A permanent All Year Round restaurant and cafe recommendation section
- Google Maps search buttons for every catalog place
- **Plan My Day** route generator that respects the selected month and category
- **Surprise me** random place picker that respects the selected month and category
- Keyboard focus styles, responsive cards, and reduced-motion support
- Locally generated Aseer-inspired design; no remote fonts, scripts, image embeds, or APIs

Built with Claude Code during the KKU Claude Code hackathon

Started on 2026-09-27
