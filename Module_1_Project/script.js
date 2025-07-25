let homePageData = {
    now_playing: [],
    popular: [],
    upcoming: []
};

let carouselData = [];
let bookedTickets = JSON.parse(localStorage.getItem('booked-tickets')) || [];

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer YOUR_TOKEN_HERE' // Replace with your actual token
    }
};

window.onload = async function () {
    const api_arr = ['now_playing', 'popular', 'upcoming', 'top_rated'];

    async function fetchHomePageMovies() {
        try {
            for (const category of api_arr) {
                const url = `https://api.themoviedb.org/3/movie/${category}?language=en-US&page=1`;
                const res = await fetch(url, options);
                const data = await res.json();

                if (category === 'top_rated') {
                    carouselData = data.results.slice(0, 4);
                } else {
                    homePageData[category] = data.results;

                    // Populate <select> with movie titles
                    if (category === 'popular') {
                        const movieSelect = document.getElementById('movie-names');
                        movieSelect.innerHTML = `<option value="">Select a Movie</option>`;
                        data.results.forEach(movie => {
                            movieSelect.innerHTML += `<option value="${movie.original_title}">${movie.original_title}</option>`;
                        });
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching homepage movies:', err);
        }
    }

    async function fetchAllGenres() {
        try {
            const res = await fetch('https://api.themoviedb.org/3/genre/movie/list?language=en', options);
            const data = await res.json();

            const genreSelect = document.getElementById('genres');
            genreSelect.innerHTML = `<option value="">Select Genre</option>` + 
                data.genres.map(genre =>
                    `<option value="${genre.id}">${genre.name}</option>`
                ).join('');
        } catch (err) {
            console.error('Error fetching genres:', err);
        }
    }

    function displayCarouselData() {
        const container = document.querySelector('.carousel-inner');
        container.innerHTML = '';

        carouselData.forEach((movie, index) => {
            const item = document.createElement('div');
            item.className = `carousel-item${index === 0 ? ' active' : ''}`;

            item.innerHTML = `
                <div class="hero-content">
                    <div class="hero-info">
                        <h2 class="hero-title">${movie.original_title}</h2>
                        <p class="hero-description">${movie.overview}</p>
                    </div>
                    <div class="hero-image">
                        <img src="https://image.tmdb.org/t/p/w780/${movie.backdrop_path}" alt="${movie.original_title}" />
                    </div>
                </div>`;
            container.appendChild(item);
        });
    }

    function displayMovieGrids() {
        const sectionMap = {
            'Brand new releases': homePageData.now_playing,
            'Continue watching': homePageData.popular,
            'Coming soon': homePageData.upcoming
        };

        const sections = document.querySelectorAll('.content-section');

        sections.forEach(section => {
            const title = section.querySelector('.section-title')?.textContent?.trim();
            const movies = sectionMap[title];

            if (movies && movies.length > 0) {
                const grid = section.querySelector('.movie-grid');
                grid.innerHTML = '';

                movies.forEach(movie => {
                    const card = document.createElement('div');
                    card.className = 'movie-card';
                    card.innerHTML = `
                        <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}" />
                        <div class="movie-overlay">
                            <h4>${movie.title}</h4>
                        </div>`;
                    grid.appendChild(card);
                });
            }
        });
    }

    await fetchHomePageMovies();
    await fetchAllGenres();
    displayCarouselData();
    displayMovieGrids();
};

// Genre filter handler
document.getElementById('genres').addEventListener('change', async function (e) {
    const genreId = e.target.value;
    const genreName = e.target.options[e.target.selectedIndex].text;

    if (!genreId) return;

    const url = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&language=en&page=1`;
    try {
        const res = await fetch(url, options);
        const data = await res.json();
        displayGenreSection(genreName, data.results);
    } catch (err) {
        console.error('Error fetching genre movies:', err);
    }
});

function displayGenreSection(genreName, movies) {
    const section = document.getElementById('genre-section');
    const title = document.getElementById('genre-title');
    const grid = document.getElementById('genre-grid');

    section.style.display = 'block';
    title.textContent = genreName;
    grid.innerHTML = '';

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="https://image.tmdb.org/t/p/w300${movie.poster_path}" alt="${movie.title}" />
            <div class="movie-overlay">
                <h4>${movie.title}</h4>
            </div>`;
        grid.appendChild(card);
    });
}

// Click movie to open trailer
document.addEventListener('click', function (e) {
    const img = e.target.closest('.movie-card img');
    if (!img) return;

    const card = img.closest('.movie-card');
    const movieName = card?.querySelector('h4')?.textContent?.trim();
    if (movieName) {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(movieName + ' trailer')}`;
        window.open(url, '_blank');
    }
});

// Book Ticket Function
function bookMovieTicket(event) {
    event.preventDefault();

    const movieName = document.getElementById('movie-names').value.trim();
    const movieDate = document.getElementById('booking-date').value;
    const bookingTime = document.getElementById('booking-time').value;

    if (!movieName || !movieDate || !bookingTime) {
        alert('Please fill in all the fields.');
        return;
    }

    const ticket = { movieName, movieDate, bookingTime };
    bookedTickets.push(ticket);
    localStorage.setItem('booked-tickets', JSON.stringify(bookedTickets));

    alert(`Movie Ticket for "${movieName}" booked for ${movieDate} on ${bookingTime}.`);
    document.getElementById('booking-form').reset();
}

// Attach submit event
document.getElementById('booking-form')?.addEventListener('submit', bookMovieTicket);
