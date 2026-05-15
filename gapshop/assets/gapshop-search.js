(function ($) {
    'use strict';

    const DEBOUNCE_MS = 280;
    let debounceTimer = null;
    let currentQuery = '';

    function buildOverlay() {
        if ($('#gs-search-overlay').length) return;
        $('body').append(`
            <div id="gs-search-overlay" style="display:none" aria-hidden="true">
                <div id="gs-search-backdrop"></div>
                <div id="gs-search-modal">
                    <div id="gs-search-header">
                        <input type="search" id="gs-search-input"
                               placeholder="Search products..." autocomplete="off" autofocus>
                        <button id="gs-search-close" aria-label="Close">&times;</button>
                    </div>
                    <div id="gs-search-body">
                        <div id="gs-search-results"></div>
                    </div>
                </div>
            </div>
        `);
        bindEvents();
    }

    function openOverlay() {
        buildOverlay();
        $('#gs-search-overlay').show().removeAttr('aria-hidden');
        $('#gs-search-input').focus();
    }

    function closeOverlay() {
        $('#gs-search-overlay').hide().attr('aria-hidden', 'true');
        $('#gs-search-results').empty();
        currentQuery = '';
    }

    function bindEvents() {
        $('#gs-search-close, #gs-search-backdrop').on('click', closeOverlay);
        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') closeOverlay();
        });
        $('#gs-search-input').on('input', function () {
            const q = $(this).val().trim();
            clearTimeout(debounceTimer);
            if (q.length < 2) {
                $('#gs-search-results').empty();
                return;
            }
            debounceTimer = setTimeout(() => doSearch(q), DEBOUNCE_MS);
        });
        $('#gs-search-input').on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = $(this).val().trim();
                if (q) window.location.href = `/?s=${encodeURIComponent(q)}&gapshop_search=1`;
            }
        });
    }

    function doSearch(q) {
        if (q === currentQuery) return;
        currentQuery = q;
        $('#gs-search-results').html('<div class="gs-loading"><span></span><span></span><span></span></div>');

        $.get(gapshopSearch.ajaxUrl, {
            action: 'gapshop_search',
            nonce:  gapshopSearch.nonce,
            q,
            limit: 8
        })
        .done(function (resp) {
            if (!resp.success) { renderError(); return; }
            renderResults(resp.data, q);
        })
        .fail(renderError);
    }

    function renderResults(data, q) {
        const $el = $('#gs-search-results');
        if (!data.hits || data.hits.length === 0) {
            $el.html(`<p class="gs-no-results">No results for <strong>${escHtml(q)}</strong></p>`);
            return;
        }
        let html = `<p class="gs-result-count">${data.totalHits} result${data.totalHits !== 1 ? 's' : ''} for <strong>${escHtml(q)}</strong></p><div class="gs-hits">`;
        data.hits.forEach(p => {
            const img = p.imageUrl
                ? `<img src="${escHtml(p.imageUrl)}" alt="${escHtml(p.name)}">`
                : `<div class="gs-no-img"></div>`;
            const compare = p.comparePrice && p.comparePrice > p.price
                ? `<s class="gs-compare">$${parseFloat(p.comparePrice).toFixed(2)}</s>`
                : '';
            html += `
                <a class="gs-hit" href="/products/${escHtml(p.slug)}">
                    <div class="gs-hit-img">${img}</div>
                    <div class="gs-hit-info">
                        <span class="gs-hit-name">${escHtml(p.name)}</span>
                        ${p.categoryName ? `<span class="gs-hit-cat">${escHtml(p.categoryName)}</span>` : ''}
                        <span class="gs-hit-price">${compare}$${parseFloat(p.price).toFixed(2)}</span>
                    </div>
                </a>`;
        });
        html += '</div>';
        if (data.totalHits > 8) {
            html += `<a class="gs-view-all" href="/?s=${encodeURIComponent(q)}&gapshop_search=1">View all ${data.totalHits} results →</a>`;
        }
        $el.html(html);
    }

    function renderError() {
        $('#gs-search-results').html('<p class="gs-no-results">Search unavailable. Please try again.</p>');
    }

    function escHtml(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Hook into WP search forms + add trigger button
    $(document).ready(function () {
        // Intercept native search form submissions
        $('form[role="search"], .search-form, .wp-block-search__button-outside').on('submit', function (e) {
            const $input = $(this).find('input[type="search"], input[name="s"]');
            if ($input.length) {
                e.preventDefault();
                buildOverlay();
                openOverlay();
                $('#gs-search-input').val($input.val());
                if ($input.val().length >= 2) doSearch($input.val().trim());
            }
        });

        // Add search icon into nav menu list
        if ($('.gs-search-trigger').length === 0) {
            const $menuUl = $('nav ul, .site-header ul, .main-navigation ul').first();
            if ($menuUl.length) {
                $menuUl.append(
                    `<li class="gs-search-menu-item" style="list-style:none;display:flex;align-items:center">
                <button class="gs-search-trigger" aria-label="Search" title="Search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
            </li>`
                );
            } else {
                $('nav, .site-header, .main-navigation').first().append(
                    `<button class="gs-search-trigger" aria-label="Search" title="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
            </button>`
                );
            }
        }
        $(document).on('click', '.gs-search-trigger', openOverlay);
    });

}(jQuery));