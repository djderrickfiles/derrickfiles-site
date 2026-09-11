#!/bin/bash
# Double-click this file to push the site to GitHub.
cd "$(dirname "$0")"
echo "Pushing Derrick Files Studio site to GitHub..."
git init -q 2>/dev/null
git add -A
git -c user.email="derrickfilesug@gmail.com" -c user.name="DJ Derrick Files" commit -q -m "Derrick Files Studio website — 20 pages, control panel, blog" || echo "(nothing new to commit)"
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin https://github.com/djderrickfiles/derrickfiles-site.git
git push -u origin main
echo ""
echo "Done. Now connect Cloudflare Pages:"
echo "  Build command: node build.mjs"
echo "  Output directory: dist"
echo "  Env var NODE_VERSION = 20"
read -p "Press return to close."
