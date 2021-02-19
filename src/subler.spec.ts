import { join } from 'path';
import { Atoms, MediaKind, Subler } from './subler';

describe(Subler, () => {
    it('Should contain `demo.mp4`.', function () {
        const file = join(__dirname, 'demo.mp4');
        const tagCommand = new Subler(file, new Atoms().add('Title', 'Foo Bar Title')).buildTagCommand();

        expect(tagCommand.args).toContain(file);
    });

    describe(Subler.prototype.mediaKind, () => {
        it('Should be an instance of `Subler`.', function () {
            const mediaKind = new Subler('demo.mp4', new Atoms().add('Title', 'Foo Bar Title')).mediaKind(MediaKind.MOVIE);

            expect(mediaKind).toBeInstanceOf(Subler);
        });
    });

    describe(Subler.prototype.dest, () => {
        it('Should be an instance of `Subler`.', function () {
            const mediaKind = new Subler('demo.mp4', new Atoms().add('Title', 'Foo Bar Title')).dest('dest/path');

            expect(mediaKind).toBeInstanceOf(Subler);
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