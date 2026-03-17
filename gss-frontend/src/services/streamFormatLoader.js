import yaml from 'js-yaml';

const REQUIRED_TOP_LEVEL = ['name', 'version'];

function validateFormat(config) {
    const errors = [];

    for (const field of REQUIRED_TOP_LEVEL) {
        if (config[field] == null) {
            errors.push(`Missing required field: "${field}"`);
        }
    }

    const hasPresets = Array.isArray(config.presets);
    const hasSegments = Array.isArray(config.segments);

    if (!hasPresets && !hasSegments) {
        errors.push('Must have either "presets" or "segments" array');
        return errors;
    }

    const sceneIds = config.scenes ? Object.keys(config.scenes) : [];

    // Validate v2 presets
    if (hasPresets) {
        config.presets.forEach((p, i) => {
            if (!p.id) errors.push(`Preset ${i}: missing "id"`);
            if (!p.name) errors.push(`Preset ${i}: missing "name"`);

            if (p.scene && sceneIds.length > 0 && !sceneIds.includes(p.scene)) {
                errors.push(`Preset "${p.id}": references unknown scene "${p.scene}"`);
            }
            if (p.scenes) {
                for (const s of p.scenes) {
                    if (sceneIds.length > 0 && !sceneIds.includes(s)) {
                        errors.push(`Preset "${p.id}": references unknown scene "${s}"`);
                    }
                }
            }
        });
    }

    // Validate v1 segments
    if (hasSegments) {
        config.segments.forEach((seg, i) => {
            if (!seg.id) errors.push(`Segment ${i}: missing "id"`);
            if (!seg.name) errors.push(`Segment ${i}: missing "name"`);

            if (seg.scene && sceneIds.length > 0 && !sceneIds.includes(seg.scene)) {
                errors.push(`Segment ${i} ("${seg.id}"): references unknown scene "${seg.scene}"`);
            }
        });
    }

    return errors;
}

export async function loadStreamFormat(name) {
    const url = `/stream-formats/${name}.yaml`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load stream format "${name}": ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const config = yaml.load(text);

    const errors = validateFormat(config);
    if (errors.length > 0) {
        throw new Error(`Stream format "${name}" validation errors:\n${errors.join('\n')}`);
    }

    return config;
}

export async function listStreamFormats() {
    try {
        const response = await fetch('/stream-formats/index.json');
        if (response.ok) {
            return await response.json();
        }
    } catch { /* ignore */ }

    return ['cassie-march26'];
}
