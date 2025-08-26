
function showPage(pageId) {
    let pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';
}

// Default dashboard
window.onload = function() {
    showPage('dashboard');
};
