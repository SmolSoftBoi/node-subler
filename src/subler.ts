import { ChildProcess, spawn, spawnSync, SpawnSyncReturns } from 'child_process';
import { existsSync } from 'fs';
import { join, parse } from 'path';
import { env } from 'process';

/**
 * Represents the type of media for an input file.
 */
export enum MediaKind {

    /** Movie */
    MOVIE = 'Movie',

    /** Music */
    MUSIC = 'Music',

    /** Audiobook */
    AUDIOBOOK = 'Audiobook',

    /** Music Video */
    MUSIC_VIDEO = 'Music Video',

    /** TV Show */
    TV_SHOW = 'TV Show',

    /** Booklet */
    BOOKLET = 'Booklet',

    /** Rington */
    RINGTONE = 'Rightone'
}

/** Command */
export interface SublerCommand {

    /** Command */
    command: string,

    /** Arguments */
    args: string[]
}

/** Subler */
export interface SublerStruct {

    /**
     * The path to the source file.
     */
    source: string,

    /**
     * The path to the destination file.
     */
    dest?: string,

    /**
     * Create chapters preview images.
     */
    chaptersPreview: boolean;

    /**
     * The Subler optimization flag.
     */
    optimize: boolean,

    /**
     * Enable tracks and create altenate groups in the iTunes friendly way.
     */
    organizeGroups: boolean,

    /**
     * 64-bit file (only when dest isn't an existing file).
     */
    bitChunk64: boolean;

    /**
     * The atoms that should be written to the file.
     */
    atoms: Atoms,

    /**
     * The media kind of the file.
     */
    mediaKind?: MediaKind
}

/** Subler */
export class Subler {

    /** Subler */
    private subler: SublerStruct;

    /**
     * Creates a new Subler interface with a set of Atoms that should be set to the the file at the `source`.
     * By default Media Kind is set to `MediaKind.MOVIE` and optimization level is set to true.
     * @param source Source
     * @param atoms Aroms.
     * @returns Subler
     */
    constructor(source: string, atoms: Atoms) {
        this.subler = {
            source: source,
            chaptersPreview: true,
            optimize: true,
            organizeGroups: true,
            bitChunk64: true,
            atoms: atoms,
            mediaKind: MediaKind.MOVIE
        };
    }

    /**
     * Returns the path to the Subler executeable.
     * Assumes a homebrew installtion by default under `/usr/local/bin/SublerCli`,
     * can be overwritten setting the `SUBLER_CLI_PATH` env variable.
     */
    public executable(): string {
        return env.SUBLER_PATH || '/usr/local/bin/SublerCli';
    }

    /**
     * Executes the tagging command as a child process, returning a handle to it.
     * @returns Child Process
     */
    public spawnTag(): ChildProcess {
        /** Command */
        const command = this.buildTagCommand();

        return spawn(`${command.command} ${command.args.join(' ')}`, {
            shell: true
        });
    }

    /**
     * Create the subler process command.
     * @returns Subler process command.
     */
    public buildTagCommand(): SublerCommand {
        if (!existsSync(this.subler.source)) {
            throw new Error('Source file does not exist.');
        }

        if (this.subler.mediaKind) {
            this.subler.atoms.addAtom(new Atom('Media Kind', this.subler.mediaKind))
        }

        /** Destination */
        const dest = this.determineDest();

        if (!dest) {
            throw new Error('Destination Not Found!');
        }

        /** Atoms */
        const atoms = this.subler.atoms.args();

        /** Escaped Dest */
        const escapedSource = this.subler.source.replace(/\s|&|'/g, '\\$&');

        /** Arguments */
        const args = [ '-source', escapedSource ];

        /** Escaped Dest */
        const escapedDest = dest.replace(/\s|&|'/g, '\\$&');

        args.push(...[ '-dest', escapedDest ]);

        /** Meta Tags */
        const metaTags = atoms;

        args.push(...metaTags);

        if (this.subler.chaptersPreview) args.push('-chapterspreview');
        if (this.subler.optimize) args.push('-optimize');
        if (this.subler.organizeGroups) args.push('-organizegroups');
        if (this.subler.bitChunk64) args.push('-64bitchunk');

        return {
            command: this.executable(),
            args: args
        };
    }

    /**
     * Apply the specified metadata to the source file and output it to the specified destination file.
     * @returns Spawn
     */
    public tag(): SpawnSyncReturns<Buffer> {
        /** Command */
        const cmd = this.buildTagCommand();

        return spawnSync(`${cmd.command} ${cmd.args.join(' ')}`, {
            shell: true
        });
    }

    /**
     * Sets the optimization flag.
     * @param value Value
     * @returns This
     */
    public optimise(value: boolean): this {
        this.subler.optimize = value;

        return this;
    }

    /**
     * Media Kind
     * @param kind Media Kind
     * @returns This
     */
    public mediaKind(kind: MediaKind): this {
        this.subler.mediaKind = kind;

        return this;
    }

    /**
     * Sets the destination of the output file.
     * @param dest Destination
     * @returns This
     */
    public dest(dest: string): this {
        this.subler.dest = dest;

        return this;
    }

    /**
     * Computes the next available path by appending.
     * @param p P
     * @param i I
     * @returns Destination
     */
    private nextAvailablePath(p: string, i: number): string | undefined {
        /** Path */
        const path = parse(p);

        /** Destination */
        const dest = join(path.dir, `${path.name}.${i}${path.ext}`);

        if (existsSync(dest)) {
            this.nextAvailablePath(p, i + 1);
        } else {
            return dest;
        }
    }

    /**
     * Finds the next valid destination path,
     * if no dest path is supplied then the destination path is the existing file name suffixed, starting from 0.
     * @returns Destination
     */
    private determineDest(): string | undefined {
        if (this.subler.dest) {
            if (existsSync(this.subler.dest)) {
                return this.nextAvailablePath(this.subler.dest, 0);
            } else {
                return this.subler.dest;
            }
        } else {
            return this.nextAvailablePath(this.subler.source, 0);
        }
    }
}

/**
 * Represents a Metadata Media Atom.
 */
export interface AtomStruct {

    /**
     * The Name of the Metadata Atom.
     */
    tag: string,

    /**
     * The Value this atom contains.
     */
    value: string
}

/** Atom */
export class Atom {

    /** Atom */
    private atom: AtomStruct;

    /**
     * @param tag Tag
     * @param val Value
     */
    constructor(tag: string, val: string) {
        this.atom = {
            tag: tag,
            value: val
        };
    }

    /** Argument */
    public arg(): string {
        /** Escaped Value */
        let escapedValue = this.atom.value.replace(/[\n|\r]+/g, ' ').replace(/'/g, '\\$&');

        if (this.atom.tag !== AtomTag.artwork) escapedValue = `'${escapedValue}'`;

        return `{'${this.atom.tag}':${escapedValue}}`;
    }
}

/** Builder */
export interface BuilderStruct {

    /** Atoms */
    atoms: Atom[];
}

export class Builder {

    /** Inner Atoms */
    inner: Atom[] = [];

    /**
     * Add Atom
     * @param atom Atom
     * @returns This
     */
    public addAtom(atom: Atom): this {
        this.inner.push(atom);

        return this;
    }

    /**
     * Add
     * @param tag Tag
     * @param val Value
     * @returns This
     */
    public add(tag: string, val: string): this {
        this.inner.push(new Atom(tag, val));

        return this;
    }

    /**
     * Build
     * @returns Atoms
     */
    public build(): AtomsStruct {
        return {
            inner: this.inner
        };
    }

    /**
     * Default
     * @returns Builder
     */
    static default(): Builder {
        return new Builder();
    }
}

/** Atom */
export interface AtomsStruct {

    /**
     * The stored atoms.
     */
    inner: Atom[];
}

/** Atoms */
export class Atoms extends Builder {

    /**
     * All valid Metadata Atom tags.
     * @returns Metadata Tags
     */
    public metadataTags(): string[] {
        /** Parameters */
        const params: string[] = [];

        for (const tag of Object.values(AtomTag)) {
            params.push(tag);
        }

        return params;
    }

    /**
     * Arguments for setting the metaflag flag of subler.
     * @returns Arguments
     */
    public args(): string[] {
        /** Arguments */
        const args: string[] = [];

        if (this.inner.length > 0) {
            args.push(...[ '-metadata', this.inner.map(atom => atom.arg()).join('') ]);

        }

        return args;
    }

    /**
     * Add Atom
     * @param atom Atom
     * @returns This
     */
    public addAtom(atom: Atom): this {
        this.inner.push(atom);

        return this;
    }

    /**
     * Add Atoms
     * @param atoms Atoms
     * @returns This
     */
    public addAtoms(atoms: Atoms): this {
        this.inner.push(...atoms.inner);

        return this;
    }

    /**
     * Add
     * @param tag Tag
     * @param val Value
     * @returns This
     */
    public add(tag: string, val: string): this {
        this.inner.push(new Atom(tag, val));

        return this;
    }

    /**
     * Atoms
     * @returns Atoms
     */
    public atoms(): Atom[] {
        return this.inner;
    }
}

/** Atom Tag */
export const AtomTag = {

    /** Artist */
    artist: 'Artist',

    /** Album Artist */
    albumArtist: 'Album Artist',

    /** Album */
    album: 'Album',

    /** Grouping */
    grouping: 'Grouping',

    /** Composer */
    composer: 'Composer',

    /** Comments */
    comments: 'Comments',

    /** Genre */
    genre: 'Genre',

    /** Release Date */
    releaseDate: 'Release Date',

    /** Track Number */
    trackNumber: 'Track #',

    /** Disk NNumber */
    diskNumber: 'Disk #',

    /** Tempo */
    tempo: 'Tempo',

    /** TV Show */
    tvShow: 'TV Show',

    /** TV Episode Number */
    tvEpisodeNumber: 'TV Episode #',

    /** TV Network */
    tvNetwork: 'TV Network',

    /** TV Episode ID */
    tvEpisodeId: 'TV Episode ID',

    /** TV Season */
    tvSeason: 'TV Season',

    /** Description */
    description: 'Description',

    /** Long Description */
    longDescription: 'Long Description',

    /** Serious Description */
    seriesDescription: 'Series Description',

    /** HD Video */
    hdVideo: 'HD Video',

    /** Rating Annotation */
    ratingAnnotation: 'Rating Annotation',

    /** Studio */
    studio: 'Studio',

    /** Cast */
    cast: 'Cast',

    /** Director */
    director: 'Director',

    /** Gapless */
    gapless: 'Gapless',

    /** Codirector */
    codirector: 'Codirector',

    /** Producers */
    producers: 'Producers',

    /** Screenwriters */
    screenwriters: 'Screenwriters',

    /** Lyrics */
    lyrics: 'Lyrics',

    /** Copyright */
    copyright: 'Copyright',

    /** Encoding Tool */
    encodingTool: 'Encoding Tool',

    /** Encoded by */
    encoded_by: 'Encoded By',

    /** Keywords */
    keywords: 'Keywords',
    
    /** Category */
    category: 'Category',

    /** Content ID */
    contentId: 'contentID',

    /** Artist ID */
    artistId: 'artistID',

    /** Playlist ID */
    playlistId: 'playlistID',

    /** Genre ID */
    genreId: 'genreID',

    /** Composer ID */
    composerId: 'composerID',

    /** XID */
    xid: 'XID',

    /** iTunes Account */
    itunesCccount: 'iTunes Account',

    /** iTunes Account Type */
    itunesAccountType: 'iTunes Account Type',

    /** iTunes Country */
    itunesCountry: 'iTunes Country',

    /** Track Sub-Title */
    trackSubTitle: 'Track Sub-Title',

    /** Song Description */
    songDescription: 'Song Description',

    /** Art Director */
    artDirector: 'Art Director',

    /** Arranger */
    arranger: 'Arranger',

    /** Lyricist */
    lyricist: 'Lyricist',

    /** Acknowledgement */
    acknowledgement: 'Acknowledgement',

    /** Conductor */
    conductor: 'Conductor',

    /** Linear Notes */
    linearNotes: 'Linear Notes',

    /** Record Company */
    recordCompany: 'Record Company',

    /** Original Artist */
    originalArtist: 'Original Artist',

    /** Phonogram Rights */
    phonogramRights: 'Phonogram Rights',

    /** Producer */
    producer: 'Producer',

    /** Performer */
    performer: 'Performer',

    /** Publisher */
    publisher: 'Publisher',

    /** Sound Engineer */
    soundEngineer: 'Sound Engineer',

    /** Soloist */
    soloist: 'Soloist',

    /** Credits */
    credits: 'Credits',

    /** Thanks */
    thanks: 'Thanks',

    /** Online Extras */
    onlineExtras: 'Online Extras',

    /** Executive Producer */
    executiveproducer: 'Executive Producer',

    /** Sort Name */
    sortName: 'Sort Name',

    /** Sort Artist */
    sortArtist: 'Sort Artist',

    /** Sort Album Artist */
    sortAlbumArtist: 'Sort Album Artist',

    /** Sort Album */
    sortAlbum: 'Sort Album',

    /** Sort Composer */
    sortComposer: 'Sort Composer',

    /** Sort TV Show */
    sortTvShow: 'Sort TV Show',

    /** Artwork */
    artwork: 'Artwork',

    /** Name */
    name: 'Name',

    /** Title */
    title: 'Name',

    /** Rating */
    rating: 'Rating',

    /** Media Kind */
    mediaKind: 'Media Kind'
}

for (const [ ident, tag ] of Object.entries(AtomTag)) {
    Atoms.prototype[ident] = function (value: string): Atoms {
        this.inner.push(new Atom(tag, value));

        return this;
    };

    Builder.prototype[ident] = function (value: string): Builder {
        this.inner.push(new Atom(tag, value));

        return this;
    }
}