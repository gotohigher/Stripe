'use strict';

require('../testUtils');

import fs = require('fs');
import path = require('path');
import NodePlatformFunctions = require('../lib/platform/NodePlatformFunctions');
import PlatformFunctions = require('../lib/platform/PlatformFunctions');

import {expect} from 'chai';

let platforms: Record<string, PlatformFunctions>;

if (process.versions.node < '15') {
  console.log(
    `Skipping WebPlatformFunctions tests. Cannot load WebPlatformFunctions because 'Event' is not available in the global scope for ${process.version}.`
  );
  platforms = {
    Node: new NodePlatformFunctions(),
  };
} else {
  const WebPlatformFunctions = require('../lib/platform/WebPlatformFunctions');
  platforms = {
    Web: new WebPlatformFunctions(),
    Node: new NodePlatformFunctions(),
  };
}

for (const platform in platforms) {
  const platformFunctions = platforms[platform];
  const isNodeEnvironment = platform === 'Node';

  describe(`${platform}PlatformFunctions`, () => {
    describe('uuid', () => {
      describe('should use crypto.randomUUID if it exists', () => {
        const crypto = require('crypto');
        let randomUUID$;
        let called;
        beforeEach(() => {
          // if it's available, mock it and ensure it's called
          // otherwise, skip this whole operation
          if (isNodeEnvironment && crypto.randomUUID) {
            called = false;
            randomUUID$ = crypto.randomUUID;
            crypto.randomUUID = (): string => {
              called = true;
              return 'no, YOU you id';
            };
          }
        });
        afterEach(() => {
          if (randomUUID$) {
            crypto.randomUUID = randomUUID$;
          }
        });
        it('is called if available', () => {
          if (randomUUID$) {
            expect(platformFunctions.uuid4()).to.equal('no, YOU you id');
            expect(called).to.equal(isNodeEnvironment);
          }
        });

        it('returns a valid v4 UUID without it', () => {
          crypto.randomUUID = null;
          expect(platformFunctions.uuid4()).to.match(
            // regex from https://createuuid.com/validator/, specifically for v4
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          );
        });
      });

      it('should return a well-formatted v4 UUID', () => {
        expect(platformFunctions.uuid4()).to.match(
          // regex from https://createuuid.com/validator/, specifically for v4
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        // further test: could spy on crypto.randomUUID to ensure it's being used, if available
        // whether that's useful is a race between using jest/sinon for these tests and dropping support for node < 14
      });
    });

    describe('secureCompare with crypto.timingSafeEqual', () => {
      it('returns true given two equal things', () => {
        expect(platformFunctions.secureCompare('potato', 'potato')).to.equal(
          true
        );
      });

      it('returns false given two unequal things', () => {
        expect(platformFunctions.secureCompare('potato', 'tomato')).to.equal(
          false
        );
      });

      it('returns false given things of unequal lengths', () => {
        expect(platformFunctions.secureCompare('potat', 'tomato')).to.equal(
          false
        );
      });

      it('throws an error if not given two things to compare', () => {
        expect(() => {
          platformFunctions.secureCompare('potato');
        }).to.throw();
      });
    });

    describe('secureCompare without crypto.timingSafeEqual', () => {
      const crypto = require('crypto');
      let timingSafeEqual$;
      beforeEach(() => {
        // if it's available, mock it and ensure it's called
        // otherwise, skip this whole operation
        if (isNodeEnvironment && crypto.timingSafeEqual) {
          timingSafeEqual$ = crypto.timingSafeEqual;
          crypto.timingSafeEqual = null;
        }
      });

      afterEach(() => {
        if (timingSafeEqual$) {
          crypto.timingSafeEqual = timingSafeEqual$;
        }
      });

      it('returns true given two equal things', () => {
        expect(platformFunctions.secureCompare('potato', 'potato')).to.equal(
          true
        );
      });

      it('returns false given two unequal things', () => {
        expect(platformFunctions.secureCompare('potato', 'tomato')).to.equal(
          false
        );
      });

      it('returns false given two unequal things', () => {
        expect(platformFunctions.secureCompare('potato', 'tomato')).to.equal(
          false
        );
      });

      it('throws an error if not given two things to compare', () => {
        expect(() => {
          platformFunctions.secureCompare('potato');
        }).to.throw();
      });
    });

    describe('getUname', () => {
      let origGetUname;
      beforeEach(() => {
        origGetUname = platformFunctions.getUname;
      });
      afterEach(() => {
        platformFunctions.getUname = origGetUname;
        platformFunctions._UNAME_CACHE = null;
      });

      if (!isNodeEnvironment) {
        it('not implemented on non-Node environments', async () => {
          expect(await platformFunctions.getUname()).to.be.null;
        });

        // No need to run further tests on non-Node environments
        return;
      }

      it('runs exec', async () => {
        const calls: any[] = [];
        platformFunctions._exec = (cmd: string, cb: any): void => {
          calls.push([cmd]);
          cb();
        };

        await platformFunctions.getUname();
        expect(calls).to.deep.equal([['uname -a']]);
      });

      it('passes along normal errors', async () => {
        const myErr = Error('hi');
        platformFunctions._exec = (cmd: string, cb: any): void => {
          cb(myErr, null);
        };

        expect(await platformFunctions.getUname()).to.be.null;
      });

      it('passes along thrown errors as normal callback errors', async () => {
        const myErr = Error('hi');
        platformFunctions._exec = (cmd: string, cb: any): void => {
          throw myErr;
        };

        expect(await platformFunctions.getUname()).to.be.null;
      });
    });

    describe('createEmitter', () => {
      let emitter;
      beforeEach(() => {
        emitter = platformFunctions.createEmitter();
      });

      it('should emit a `foo` event with data to listeners', (done) => {
        function onFoo(data): void {
          emitter.removeListener('foo', onFoo);

          expect(data.bar).to.equal('bar');
          expect(data.baz).to.equal('baz');

          done();
        }

        emitter.on('foo', onFoo);
        emitter.emit('foo', {bar: 'bar', baz: 'baz'});
      });

      it('listeners registered via `on` keep firing until removed', (done) => {
        let calls = 0;

        function onFoo(): void {
          calls += 1;
        }

        emitter.on('foo', onFoo);
        emitter.emit('foo');
        expect(calls).to.equal(1);
        emitter.emit('foo');
        expect(calls).to.equal(2);
        emitter.removeListener('foo', onFoo);

        done();
      });

      it('listeners registered via `once` only fire once', (done) => {
        let calls = 0;

        function onFoo(): void {
          calls += 1;
        }

        emitter.once('foo', onFoo);
        emitter.emit('foo');
        expect(calls).to.equal(1);
        emitter.emit('foo');
        expect(calls).to.equal(1);

        done();
      });

      it('listeners registered multiple times are for each time it was registered', (done) => {
        let calls = 0;

        function onFoo(): void {
          calls += 1;
        }

        emitter.on('foo', onFoo);
        emitter.once('foo', onFoo);

        emitter.emit('foo');
        expect(calls).to.equal(2);

        done();
      });

      it('should not emit a `foo` event to removed listeners', (done) => {
        function onFoo(): void {
          done(new Error('How did you get here?'));
        }

        emitter.once('response', onFoo);
        emitter.removeListener('response', onFoo);
        emitter.emit('foo');

        done();
      });
    });

    describe('tryBufferData', () => {
      if (!isNodeEnvironment) {
        // WebPlatformFunctions
        it('should throw an error in web environments if streaming data is provided', () => {
          if (process.versions.node < '18') {
            console.log(
              `'ReadableStream' is not available in the global scope for ${process.version}, skipping test.`
            );
            return;
          }

          const f = new ReadableStream();
          const data = {
            file: {
              data: f,
              name: 'test.pdf',
              type: 'application/octet-stream',
            },
          };

          expect(() => {
            platformFunctions.tryBufferData(data);
          }).to.throw();
        });
      } else {
        // NodePlatformFunctions
        it('should return data unmodified if not a file stream', () => {
          const testFilename = path.join(
            __dirname,
            'resources/data/minimal.pdf'
          );
          const buf = fs.readFileSync(testFilename);

          // Create Uint8Array from Buffer
          const f = new Uint8Array(buf.buffer, buf.byteOffset, buf.length);

          const data = {
            file: {
              data: f,
              name: 'minimal.pdf',
              type: 'application/octet-stream',
            },
          };

          expect(
            platformFunctions.tryBufferData(data)
          ).to.eventually.deep.equal(data);
        });

        it('should load file streams into buffer', () => {
          const testFilename = path.join(
            __dirname,
            'resources/data/minimal.pdf'
          );
          const f = fs.createReadStream(testFilename);

          const data = {
            file: {
              data: f,
              name: 'minimal.pdf',
              type: 'application/octet-stream',
            },
          };

          return expect(
            platformFunctions.tryBufferData(data).then((d) => d.file.data)
          ).to.eventually.have.nested.property('length', 739);
        });
      }
    });
  });
}
