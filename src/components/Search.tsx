const Search = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className="text-white text-3xl">
            <div>
                <img src="search.svg" alt="Search" />

                <input
                    type="text"
                    placeholder="Поиск"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
            </div>
        </div>
    )
}

export default Search;
