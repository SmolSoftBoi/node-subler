import { join } from 'path';
import { Atom, AtomTag, Atoms, MediaKind, Subler } from './subler';

describe(Subler, () => {
    it('Should contain `test.mp4`.', function () {
        const file = join(__dirname, 'test.mp4');
        const tagCommand = new Subler(file, new Atoms().add('Title', 'Foo Bar Title')).buildTagCommand();

        expect(tagCommand.args).toContain(file);
    });

    describe(Subler.prototype.mediaKind, () => {
        it('Should be an instance of `Subler`.', function () {
            const mediaKind = new Subler('test.mp4', new Atoms().add('Title', 'Foo Bar Title')).mediaKind(MediaKind.MOVIE);

            expect(mediaKind).toBeInstanceOf(Subler);
        });
    });

    describe(Subler.prototype.dest, () => {
        it('Should be an instance of `Subler`.', function () {
            const mediaKind = new Subler('test.mp4', new Atoms().add('Title', 'Foo Bar Title')).dest('dest/path');

            expect(mediaKind).toBeInstanceOf(Subler);
        });

        it('Should contain `dest/path`.', function () {
            const file = join(__dirname, 'test.mp4');
            const tagCommand = new Subler(file, new Atoms().add('Title', 'Foo Bar Title')).dest('dest/path').buildTagCommand();
    
            expect(tagCommand.args).toContain('dest/path');
        });

        it('Should contain `dest & path` unmodified.', function () {
            const file = join(__dirname, 'test.mp4');
            const tagCommand = new Subler(file, new Atoms().add('Title', 'Foo Bar Title')).dest('dest & path').buildTagCommand();
    
            expect(tagCommand.args).toContain('dest & path');
        });
        
        it('Should contain `dest\'s path` unmodified.', function () {
            const file = join(__dirname, 'test.mp4');
            const tagCommand = new Subler(file, new Atoms().add('Title', 'Foo Bar Title')).dest('dest\'s path').buildTagCommand();
    
            expect(tagCommand.args).toContain('dest\'s path');
        });
    });
});

describe(Atoms, () => {
    describe(Atoms.prototype.metadataTags, () => {
        it('Should be an instance of `Array`.', function () {
            const metadataTags = new Atoms().metadataTags();

            expect(metadataTags).toBeInstanceOf(Array);
        });

        it('Should contain `Artist`.', function () {
            const metadataTags = new Atoms().metadataTags();

            expect(metadataTags).toContain('Artist');
        });

        it('Should contain `Media Kind`.', function () {
            const metadataTags = new Atoms().metadataTags();

            expect(metadataTags).toContain('Media Kind');
        });
    });

    describe(Atoms.prototype.add, () => {
        it('Should be an instance of `Atoms`.', function () {
            const atoms = new Atoms().add('Cast', 'John Doe');

            expect(atoms).toBeInstanceOf(Atoms);
        });

        it('Should equal `{\'Cast\':\'John Doe\'}`.', function () {
            const atoms = new Atoms().add('Cast', 'John Doe');
            const arg = atoms.inner[0].arg();

            expect(arg).toEqual('{\'Cast\':\'John Doe\'}');
        });

        it('Should equal `{\'Cast\':\'John\\\'s Doe\'}` (single quote escaped for SublerCLI format).', function () {
            const atoms = new Atoms().add('Cast', 'John\'s Doe');
            const arg = atoms.inner[0].arg();

            expect(arg).toEqual('{\'Cast\':\'John\\\'s Doe\'}');
        });
    });

    describe(Atoms.prototype.build, () => {
        it('Should be an instance of `Object`.', function () {
            const build = new Atoms().add('Cast', 'John Doe').build();

            expect(build).toBeInstanceOf(Object);
        });

        it('Should equal `{\'Cast\':\'John Doe\'}`.', function () {
            const build = new Atoms().add('Cast', 'John Doe').build();
            const arg = build.inner[0].arg();

            expect(arg).toEqual('{\'Cast\':\'John Doe\'}');
        });
    });
});

describe('Atom special-character regression', () => {
    it('passes a single quote escaped for SublerCLI format', () => {
        const arg = new Atom('Cast', "O'Brien").arg();
        expect(arg).toEqual("{'Cast':'O\\'Brien'}");
    });

    it('passes a backslash doubled for SublerCLI format', () => {
        const arg = new Atom('Cast', 'back\\slash').arg();
        expect(arg).toEqual("{'Cast':'back\\\\slash'}");
    });

    it('passes backslash-before-quote with both escaped for SublerCLI format', () => {
        const arg = new Atom('Cast', "it\\'s").arg();
        expect(arg).toEqual("{'Cast':'it\\\\\\'s'}");
    });

    it('passes $() literally', () => {
        const arg = new Atom('Description', '$(rm -rf /)').arg();
        expect(arg).toEqual("{'Description':'$(rm -rf /)'}");
    });

    it('passes backticks literally', () => {
        const arg = new Atom('Description', '`id`').arg();
        expect(arg).toEqual("{'Description':'`id`'}");
    });

    it('passes semicolons literally', () => {
        const arg = new Atom('Description', 'a; b').arg();
        expect(arg).toEqual("{'Description':'a; b'}");
    });

    it('replaces newlines with spaces', () => {
        const arg = new Atom('Description', 'line1\nline2').arg();
        expect(arg).toEqual("{'Description':'line1 line2'}");
    });

    it('replaces carriage returns with spaces', () => {
        const arg = new Atom('Description', 'line1\rline2').arg();
        expect(arg).toEqual("{'Description':'line1 line2'}");
    });

    it('source path is passed raw to buildTagCommand', () => {
        const file = join(__dirname, 'test.mp4');
        const tagCommand = new Subler(file, new Atoms().add('Title', 'T')).buildTagCommand();
        expect(tagCommand.args).toContain(file);
    });

    it('dest path with spaces and special chars is passed raw to buildTagCommand', () => {
        const file = join(__dirname, 'test.mp4');
        const dest = '/tmp/dest & dir/it\'s.mp4';
        const tagCommand = new Subler(file, new Atoms().add('Title', 'T')).dest(dest).buildTagCommand();
        expect(tagCommand.args).toContain(dest);
    });
});