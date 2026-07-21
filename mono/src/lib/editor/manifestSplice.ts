/**
 * Write side of `manifestFields.ts`. `spliceLomField` edits one existing
 * leaf field's text by position; `insertLomSkeleton` gives a resource that
 * has no metadata yet a minimal starting block to edit, mirroring the
 * classification/taxonPath shape the codebase's one (dead, never-shipped)
 * QTI-writer prototype targeted — a best-effort template, not a verified
 * TAO-accepted shape.
 */

import { escapeXmlText } from './xmlAttrs';
import { findResource, METADATA_OPEN } from './manifestFields';

const METADATA_RE = /<metadata>([\s\S]*?)<\/metadata>/;
const LEAF_RE = /(<([\w:]+)(?:\s[^>]*)?>)([^<]*)(<\/\2>)/g;

function rebuildResource(manifestXml: string, res: NonNullable<ReturnType<typeof findResource>>, newBody: string): string {
	const replacement = `<resource${res.attrs}>${newBody}</resource>`;
	return manifestXml.slice(0, res.start) + replacement + manifestXml.slice(res.end);
}

/** Replace one LOM leaf field's text content by its position (see `LomField.index`). No-op if not found. */
export function spliceLomField(manifestXml: string, itemFilename: string, index: number, value: string): string {
	const res = findResource(manifestXml, itemFilename);
	if (!res) return manifestXml;

	const meta = METADATA_RE.exec(res.body);
	if (!meta) return manifestXml;
	const inner = meta[1];

	LEAF_RE.lastIndex = 0;
	let m: RegExpExecArray | null;
	let i = 0;
	while ((m = LEAF_RE.exec(inner))) {
		if (i === index) {
			const encoded = escapeXmlText(value);
			if (m[3] === encoded) return manifestXml;
			const newInner = inner.slice(0, m.index) + m[1] + encoded + m[4] + inner.slice(m.index + m[0].length);
			const innerStart = meta.index + METADATA_OPEN.length;
			const newBody = res.body.slice(0, innerStart) + newInner + res.body.slice(innerStart + inner.length);
			return rebuildResource(manifestXml, res, newBody);
		}
		i += 1;
	}
	return manifestXml;
}

const LOM_SKELETON = `
      <metadata>
        <imsmd:lom>
          <imsmd:classification>
            <imsmd:taxonPath>
              <imsmd:source><imsmd:string xml:lang="en">competency</imsmd:string></imsmd:source>
              <imsmd:taxon><imsmd:entry><imsmd:string xml:lang="en"></imsmd:string></imsmd:entry></imsmd:taxon>
            </imsmd:taxonPath>
          </imsmd:classification>
        </imsmd:lom>
      </metadata>
      `;

/** Give a resource with no <metadata> yet a minimal, best-effort skeleton to edit. No-op if it already has one. */
export function insertLomSkeleton(manifestXml: string, itemFilename: string): string {
	const res = findResource(manifestXml, itemFilename);
	if (!res) return manifestXml;
	if (METADATA_RE.test(res.body)) return manifestXml;
	return rebuildResource(manifestXml, res, `${LOM_SKELETON}${res.body}`);
}
