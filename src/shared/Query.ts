export class Query {
	private readonly artist: string;
	private readonly title: string;
	private readonly album?: string;

	constructor(artist: string, title: string, album?: string) {
		this.album = album;
		this.title = title;
		this.artist = artist;
	}

	public toString(): string {
		const albumSearch: string = (this.album) ? `album:${this.album}` : '';
		const str: string = `artist:${this.artist} ${albumSearch} ${this.title}`;
		return str;
	}
}