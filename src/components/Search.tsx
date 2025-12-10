const Search = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className="text-white text-3xl">
            <img src="/search.svg" alt="Search" />

            <input
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            />
        </div>
    );
};

export default Search;
