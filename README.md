# Abha Visitor Guide

## What it does

A polished, single-page guide to 14 memorable places in Abha and Aseer. Filter by category or season, open a location in Google Maps, generate an easy four-stop day, or use **Surprise me** to discover a random attraction.

## Who it is for

Curious visitors who want a simple, visual starting point for exploring Abha's highland views, natural spaces, arts, heritage, and markets.

## Needs

A modern web browser. No installation, account, server, or internet connection is needed to browse the guide. Internet is only used after a visitor deliberately opens a Google Maps link or an image fallback's Unsplash link.

## How to run it

Double-click `index.html` to open the guide in a browser. It runs directly from the folder without a build step or server.

To add real local photos, place files named `place1.jpg` through `place14.jpg` inside `images/`. Until then, each card intentionally shows a visible fallback with an optional Unsplash link.

## Try it with the sample data

The built-in made-up guide data lives in `sample-data/data.js` and is loaded by a script tag so it also works when `index.html` is opened directly. Use **Load example guide** at the bottom of the page to restore all places and a sample itinerary.

The browser may save only your selected filters and generated itinerary IDs in localStorage. Nothing you type or choose is sent to GitHub.

### Features

- Fourteen English-language attractions across Abha and Aseer
- Category and season filters
- Google Maps search buttons for every attraction
- **Plan My Day** route generator that respects visible filters
- **Surprise me** random attraction picker
- Keyboard focus styles, responsive cards, and reduced-motion support
- Locally generated Aseer-inspired design; no remote fonts, scripts, image embeds, or APIs

Built with Claude Code during the KKU Claude Code hackathon

Started on 2026-09-27
