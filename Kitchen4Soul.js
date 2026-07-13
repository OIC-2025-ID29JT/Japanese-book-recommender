// 1. Paste your Application ID here
const APP_ID = 'a3d6b19e-ca16-429d-8c22-1884ec8fcfc1'; 
const AFFILIATE_ID = '55bee4560eb34bc255bee457684e0d45'; 

// 2. Add an event listener to the button
document.getElementById('searchBtn').addEventListener('click', async () => {
    const genreSelect = document.getElementById('genreSelect');
    const selectedKeyword = genreSelect.options[genreSelect.selectedIndex].text;
    const resultsDiv = document.getElementById('results');
    
    // Show a loading message
    resultsDiv.innerHTML = '<p>Loading books...</p>';

    // 3. Construct the API URL using keyword search instead of genreId to avoid 400 errors
    const url = `https://app.rakuten.co.jp/services/api/BooksTotal/Search/20170404?applicationId=${encodeURIComponent(APP_ID)}&affiliateId=${encodeURIComponent(AFFILIATE_ID)}&keyword=${encodeURIComponent(selectedKeyword)}&hits=10&format=json`;

    try {
        // 4. Fetch the data from Rakuten
        const response = await fetch(url);
        const data = await response.json();

        // Clear the loading message
        resultsDiv.innerHTML = '';

        // 5. Check if we got items back
        if (data.Items && data.Items.length > 0) {
            data.Items.forEach(item => {
                const book = item.Item;
                
                // Create a card for each book
                const card = document.createElement('div');
                card.className = 'book-card';
                card.innerHTML = `
                    <img src="${book.mediumImageUrl}" alt="Cover">
                    <h3>${book.title}</h3>
                    <p>Author: ${book.author}</p>
                    <a href="${book.itemUrl}" target="_blank">View on Rakuten</a>
                `;
                resultsDiv.appendChild(card);
            });
        } else {
            resultsDiv.innerHTML = '<p>No books found for this keyword.</p>';
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        resultsDiv.innerHTML = '<p>Failed to load books. Please check your console for details.</p>';
    }
});