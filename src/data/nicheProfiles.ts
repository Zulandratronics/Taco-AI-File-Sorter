import { NicheProfile, NicheProfileId, CategoryWhitelistItem } from "../types";
import { DEFAULT_CATEGORY_WHITELIST } from "./defaultTaxonomy";

export const NICHE_PROFILES: Record<NicheProfileId, NicheProfile> = {
  unconventional_polymath: {
    id: "unconventional_polymath",
    name: "Unconventional Polymath & Renaissance Synthesist",
    tagline: "For non-linear thinkers, researchers, inventor-artists, and interdisciplinary autodidacts",
    description: "Built for minds that oscillate between hardware schematics, epistemology papers, generative modular synths, speculative fiction worldbuilding, and computational simulation notebooks.",
    iconName: "BrainCircuit",
    defaultNamingPattern: "category_date_name",
    categories: [
      {
        id: "polymath_philosophy",
        name: "Epistemic Inquiries & Philosophy of Mind",
        targetFolder: "Philosophy & Epistemology/Theory & Mind",
        keywords: [
          "philosophy", "epistemology", "consciousness", "metaphysics", "cognitive",
          "cybernetics", "ontology", "logic", "dialectic", "mind", "ethics",
          "phenomenology", "semiotics", "complexity", "heuristics", "epistemic", "rationality"
        ],
        extensions: [".pdf", ".md", ".txt", ".docx", ".epub"],
        subcategories: ["Philosophy of Mind", "Epistemic Notes", "Cybernetics & Systems", "Dialectics"],
      },
      {
        id: "polymath_research_synthesis",
        name: "Interdisciplinary Research & Field Synthesis",
        targetFolder: "Research & Inquiries/Interdisciplinary_Synthesis",
        keywords: [
          "synthesis", "fieldnotes", "manuscript", "hypothesis", "literature", "whitepaper",
          "preprint", "inquiry", "paradigm", "interdisciplinary", "monograph", "survey",
          "treatise", "investigation", "cross_disciplinary", "notes", "draft"
        ],
        extensions: [".pdf", ".md", ".txt", ".docx", ".epub", ".pages"],
        subcategories: ["Synthesis Papers", "Field Notes", "Working Drafts", "Monographs"],
      },
      {
        id: "polymath_hardware_cad",
        name: "Lab, Inventions & Hardware CAD",
        targetFolder: "Lab & Prototyping/Hardware_CAD & Electronics",
        keywords: [
          "cad", "stl", "step", "stp", "gerber", "kicad", "schematic", "circuit",
          "breadboard", "arduino", "esp32", "pcb", "hardware", "sensor", "prototype",
          "3dprint", "fab", "soldering", "datasheet", "pinout", "firmware", "gcode", "cam"
        ],
        extensions: [".stl", ".step", ".stp", ".kicad_pcb", ".sch", ".ino", ".gcode", ".dxf", ".dwg", ".blend", ".obj", ".pdf"],
        subcategories: ["3D Printing & CAD", "Circuits & PCBs", "Firmware & Microcontrollers", "Datasheets"],
      },
      {
        id: "polymath_computation_notebooks",
        name: "Computational Notebooks & Algorithmic Experiments",
        targetFolder: "Computation & Lab/Algorithmic_Experiments",
        keywords: [
          "notebook", "simulation", "monte_carlo", "cellular_automata", "neural", "heuristic",
          "algorithm", "julia", "model", "agent", "stochastic", "math", "proof", "automata",
          "differential", "chaos", "dynamical", "vector", "embedding", "benchmark"
        ],
        extensions: [".ipynb", ".py", ".jl", ".r", ".m", ".cpp", ".rs", ".csv", ".json"],
        subcategories: ["Jupyter Notebooks", "Simulations", "Agent Models", "Mathematical Proofs"],
      },
      {
        id: "polymath_worldbuilding_lore",
        name: "Worldbuilding, Speculative Fiction & Creative Lore",
        targetFolder: "Creative Works/Worldbuilding & Speculative_Lore",
        keywords: [
          "lore", "worldbuilding", "character", "mythos", "chapter", "novel", "canon",
          "script", "fiction", "screenplay", "dialogue", "lorebook", "timeline", "magic_system",
          "pantheon", "faction", "speculative", "manuscript", "dossier"
        ],
        extensions: [".md", ".txt", ".docx", ".fountain", ".pdf", ".rtf"],
        subcategories: ["World Lore & Timelines", "Manuscripts & Chapters", "Character Sheets", "Magic & Tech Systems"],
      },
      {
        id: "polymath_sonic_modular",
        name: "Sonic Lab, Modular Synths & Field Recordings",
        targetFolder: "Sonic_Lab/Modular_Synths & Acoustics",
        keywords: [
          "soundscape", "synth", "patch", "midi", "ableton", "field_recording", "stem",
          "binaural", "frequency", "oscillator", "modular", "sample", "ambient", "drone",
          "foley", "eurorack", "vcv", "wavetable", "resonator", "acoustic"
        ],
        extensions: [".wav", ".flac", ".mp3", ".mid", ".midi", ".als", ".vcv", ".aif", ".aiff", ".ogg"],
        subcategories: ["Modular Patches", "Field Recordings", "Stems & Soundscapes", "Acoustic Experiments"],
      },
      {
        id: "polymath_zettelkasten",
        name: "Zettelkasten & Cognitive Slip-Box",
        targetFolder: "Zettelkasten/SlipBox & Cognitive_Nodes",
        keywords: [
          "zettel", "slipbox", "permanent_note", "fleeting_note", "literature_note",
          "index", "atomic", "backlink", "obsidian", "roam", "logseq", "concept_map",
          "node", "moc", "slip_box", "slip-box", "excerpts"
        ],
        extensions: [".md", ".canvas", ".json", ".txt"],
        subcategories: ["Atomic Notes", "Maps of Content (MOC)", "Literature Excerpts", "Fleeting Thoughts"],
      },
      {
        id: "polymath_generative_art",
        name: "Generative Art, Shaders & Visual Experimentation",
        targetFolder: "Visual_Experiments/Generative_Art & Shaders",
        keywords: [
          "shader", "glsl", "generative", "p5", "processing", "canvas", "render", "raymarching",
          "fractal", "procedural", "palette", "texture", "compute_shader", "fragment", "vertex"
        ],
        extensions: [".glsl", ".frag", ".vert", ".pde", ".png", ".jpg", ".svg", ".blend", ".tiff"],
        subcategories: ["GLSL Shaders", "Fractals & Procedural", "Renders & Textures"],
      },
      {
        id: "polymath_archives_scans",
        name: "Rare Treatises, Historical Scans & Antiquarian Artifacts",
        targetFolder: "Archives/Rare_Treatises & Antiquarian_Scans",
        keywords: [
          "antiquarian", "treatise", "rare", "scan", "archival", "facsimile", "translation",
          "manuscript_scan", "parchment", "folio", "primary_source", "archive", "historical", "alchemical"
        ],
        extensions: [".djvu", ".pdf", ".cbr", ".cbz", ".tiff", ".tif", ".jpg"],
        subcategories: ["Antiquarian Treatises", "Historical Facsimiles", "Archival Manuscripts"],
      },
      {
        id: "polymath_ventures_manifestos",
        name: "Manifestos, Patron Grants & Venture Craft",
        targetFolder: "Ventures & Patronage/Manifestos & Grant_Proposals",
        keywords: [
          "manifesto", "grant", "patron", "fellowship", "venture", "pitch", "stipend",
          "roadmap", "bounty", "thesis", "vision", "proposal", "funding", "patronage"
        ],
        extensions: [".pdf", ".docx", ".pptx", ".md", ".txt"],
        subcategories: ["Grant Applications", "Manifestos & Theses", "Venture Proposals"],
      },
    ],
  },

  independent_musician: {
    id: "independent_musician",
    name: "Independent Musician & Home Studio Producer",
    tagline: "For producers, beatmakers, songwriters, audio engineers, and indie artists",
    description: "Engineered for DAW session projects, raw multitrack stems, sample libraries, mastered singles, sync licensing split sheets, album artwork, and sheet music charts.",
    iconName: "Music",
    defaultNamingPattern: "category_date_name",
    categories: [
      {
        id: "music_daw_projects",
        name: "DAW Sessions & Project Bundles",
        targetFolder: "Production/DAW_Projects & Sessions",
        keywords: [
          "ableton", "logic", "flp", "fl_studio", "pro_tools", "reaper", "cubase", "bitwig",
          "session", "project", "als", "cpr", "ptx", "rpp", "song_idea", "arrangement", "stem_export"
        ],
        extensions: [".als", ".logicx", ".flp", ".cpr", ".ptx", ".rpp", ".bwproject", ".band"],
        subcategories: ["Ableton Live", "Logic Pro", "FL Studio", "Reaper & Pro Tools"],
      },
      {
        id: "music_stems_multitracks",
        name: "Stems, Multi-Tracks & Vocal Takes",
        targetFolder: "Production/Stems & Multitracks",
        keywords: [
          "stem", "stems", "multitrack", "vocal_lead", "lead_vox", "backing_vox", "harmonies",
          "bass_di", "guitar_direct", "drum_bus", "overhead", "snare_top", "kick_in",
          "dry_vocal", "wet_vocal", "comp", "mixdown", "tracking", "di_box"
        ],
        extensions: [".wav", ".aif", ".aiff", ".flac"],
        subcategories: ["Vocal Stems", "Drum Multi-tracks", "Instrument Stems", "Tracking Takes"],
      },
      {
        id: "music_samples_drumkits",
        name: "Sample Packs, Drum Kits & One-Shots",
        targetFolder: "Library/Samples & Drum_Kits",
        keywords: [
          "808", "kick", "snare", "hihat", "clap", "percussion", "rimshot", "cymbal",
          "drumkit", "one_shot", "loop", "bpm", "wavetable", "foley", "texture", "drop",
          "riser", "impact", "acoustic_drums", "sample_pack", "snare_hit"
        ],
        extensions: [".wav", ".aif", ".mp3", ".flac", ".sfz", ".exs"],
        subcategories: ["Drum One-Shots", "Melodic Loops", "Percussion & Foley", "SFX Transitions"],
      },
      {
        id: "music_masters_demos",
        name: "Mastered Releases, Pre-Masters & Rough Demos",
        targetFolder: "Releases/Masters & Demos",
        keywords: [
          "master", "mastered", "premaster", "unmastered", "demo", "rough_mix", "mix_v1", "mix_v2",
          "final_mix", "streaming_master", "vinyl_master", "instrumental", "radio_edit",
          "acapella", "reference_track", "bounce", "single_master"
        ],
        extensions: [".wav", ".flac", ".mp3", ".m4a", ".aac"],
        subcategories: ["Final Masters (24-bit)", "Streaming Masters", "Instrumentals & Acapellas", "Rough Demos"],
      },
      {
        id: "music_synth_presets",
        name: "Synth Presets, Soundbanks & MIDI Clips",
        targetFolder: "Library/Synth_Presets & MIDI",
        keywords: [
          "serum", "vital", "diva", "massive", "omnisphere", "kontakt", "preset", "soundbank",
          "patch", "sysex", "midi", "mid", "chord_progression", "arpeggio", "melodic_midi"
        ],
        extensions: [".fxp", ".vstpreset", ".vital", ".nmsv", ".syx", ".mid", ".midi", ".nki"],
        subcategories: ["Serum & Vital Patches", "MIDI Chord Progressions", "Kontakt Instruments", "Hardware SysEx"],
      },
      {
        id: "music_sheet_music_lyrics",
        name: "Sheet Music, Chords & Song Lyrics",
        targetFolder: "Composition/Sheet_Music & Lyrics",
        keywords: [
          "sheet_music", "score", "lead_sheet", "chord_chart", "tab", "tablature", "guitar_pro",
          "musescore", "lyrics", "rhymes", "verse", "chorus", "bridge", "transcription", "harmony"
        ],
        extensions: [".pdf", ".gp", ".gp5", ".gpx", ".mscz", ".mxl", ".txt", ".md", ".docx"],
        subcategories: ["Lead Sheets & Chords", "Guitar Tabs", "Lyrics & Rhyme Schemes", "Orchestral Scores"],
      },
      {
        id: "music_business_splits",
        name: "Split Sheets, Sync Licensing & Royalties",
        targetFolder: "Business/Licensing & Split_Sheets",
        keywords: [
          "split_sheet", "splitsheet", "ascap", "bmi", "prs", "socan", "sync", "license",
          "master_use", "synchronization", "royalty", "statement", "distrokid", "tunecore",
          "cd_baby", "isrc", "iswc", "publishing", "contract", "cue_sheet"
        ],
        extensions: [".pdf", ".docx", ".xlsx", ".csv"],
        subcategories: ["Split Sheets", "Sync Contracts", "Distro & Royalty Reports", "Cue Sheets"],
      },
      {
        id: "music_artwork_epk",
        name: "Album Artwork, Press Kit (EPK) & Merch",
        targetFolder: "Promotion/Artwork & EPK",
        keywords: [
          "album_art", "cover_art", "single_art", "artwork", "epk", "press_kit", "press_release",
          "bio", "artist_bio", "promo_photo", "band_photo", "merch", "t_shirt_design", "vinyl_mockup"
        ],
        extensions: [".png", ".jpg", ".jpeg", ".psd", ".ai", ".pdf"],
        subcategories: ["Cover Art (3000x3000)", "Electronic Press Kit (EPK)", "Promo Photos", "Merch Designs"],
      }
    ],
  },

  general_productivity: {
    id: "general_productivity",
    name: "General Productivity & Office Suite",
    tagline: "Classic taxonomy for corporate, personal, and household digital files",
    description: "Standard directory layout separating finance, legal contracts, reports, personal IDs, camera photos, downloads, installers, and archives.",
    iconName: "FolderKanban",
    defaultNamingPattern: "date_category_name",
    categories: DEFAULT_CATEGORY_WHITELIST,
  },

  digital_creator: {
    id: "digital_creator",
    name: "Digital Creator & Indie Hacker",
    tagline: "For developers, YouTubers, founders, and digital product builders",
    description: "Tailored to keep code repositories, screen recordings, video b-roll, thumbnails, marketing copy, social clips, and analytics orderly.",
    iconName: "Zap",
    defaultNamingPattern: "kebab_case",
    categories: [
      {
        id: "creator_code_repos",
        name: "Source Code, Repos & Scripts",
        targetFolder: "Development/Code_Repositories",
        keywords: ["repo", "github", "source", "script", "api", "component", "backend", "frontend", "cli", "dev", "package", "docker"],
        extensions: [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".json", ".yaml", ".yml", ".sh"],
        subcategories: ["Web Applications", "Utility Scripts", "Backend APIs", "Configurations"],
      },
      {
        id: "creator_video_footage",
        name: "Raw Footage, B-Roll & Screen Recordings",
        targetFolder: "Content/Raw_Footage & B-Roll",
        keywords: ["raw", "footage", "broll", "b-roll", "recording", "screencast", "obs", "clip", "cam", "interview", "vlog"],
        extensions: [".mp4", ".mov", ".mkv", ".webm", ".prores"],
        subcategories: ["Screen Recordings", "Camera Footage", "B-Roll Clips"],
      },
      {
        id: "creator_thumbnails_graphics",
        name: "Thumbnails, Graphics & Brand Assets",
        targetFolder: "Design/Thumbnails & Brand_Assets",
        keywords: ["thumb", "thumbnail", "banner", "logo", "brand", "asset", "vector", "icon", "cover", "graphic", "mockup"],
        extensions: [".psd", ".fig", ".png", ".jpg", ".svg", ".ai"],
        subcategories: ["YouTube Thumbnails", "Logos & Vectors", "Social Headers"],
      },
      {
        id: "creator_copy_newsletters",
        name: "Newsletters, Copy & Social Scripts",
        targetFolder: "Marketing/Copywriting & Social_Scripts",
        keywords: ["newsletter", "copy", "hook", "thread", "script", "draft", "pitch", "post", "sponsor", "media_kit"],
        extensions: [".md", ".txt", ".docx", ".pdf"],
        subcategories: ["Newsletters", "Video Scripts", "Social Threads", "Sponsorship Kits"],
      },
      {
        id: "creator_analytics_sponsors",
        name: "Sponsors, Invoices & Analytics",
        targetFolder: "Business/Sponsorships & Analytics",
        keywords: ["analytics", "metrics", "revenue", "invoice", "sponsor", "contract", "rate_card", "stripe", "payout", "partner"],
        extensions: [".pdf", ".xlsx", ".csv", ".numbers"],
        subcategories: ["Invoices", "Sponsor Contracts", "Revenue Metrics"],
      },
    ],
  },

  academic_scholar: {
    id: "academic_scholar",
    name: "Academic Scholar & University Researcher",
    tagline: "For professors, graduate researchers, scientists, and peer reviewers",
    description: "Designed for BibTeX references, LaTeX source files, datasets, peer review responses, grant proposals, and conference slide decks.",
    iconName: "GraduationCap",
    defaultNamingPattern: "category_date_name",
    categories: [
      {
        id: "academic_preprints_papers",
        name: "Peer-Reviewed Papers & Preprints",
        targetFolder: "Literature/Papers & Preprints",
        keywords: ["paper", "preprint", "arxiv", "journal", "proceedings", "conference", "manuscript", "peer_review", "springer", "ieee", "nature"],
        extensions: [".pdf", ".epub"],
        subcategories: ["Read Literature", "Preprints", "To Review"],
      },
      {
        id: "academic_latex_sources",
        name: "LaTeX Projects & BibTeX References",
        targetFolder: "Writing/LaTeX_Manuscripts",
        keywords: ["latex", "tex", "bib", "bibtex", "overleaf", "citation", "reference", "sty", "cls", "bbl"],
        extensions: [".tex", ".bib", ".sty", ".cls", ".bst"],
        subcategories: ["Article Manuscripts", "Bibliographies", "Custom Styles"],
      },
      {
        id: "academic_datasets_analysis",
        name: "Research Datasets & Statistical Analyses",
        targetFolder: "Data & Experiments/Datasets & Stats",
        keywords: ["dataset", "survey", "experiment", "participants", "regression", "p_value", "rscript", "spss", "stata", "clean_data", "raw_data"],
        extensions: [".csv", ".tsv", ".r", ".rmd", ".sav", ".dta", ".parquet", ".xlsx"],
        subcategories: ["Raw Data", "Cleaned Datasets", "R & SPSS Scripts"],
      },
      {
        id: "academic_grant_proposals",
        name: "Grants, Ethics (IRB) & Defense",
        targetFolder: "Administration/Grants & IRB_Approvals",
        keywords: ["grant", "nsf", "nih", "irb", "ethics", "fellowship", "budget", "defense", "syllabus", "tenure"],
        extensions: [".pdf", ".docx", ".xlsx"],
        subcategories: ["Grant Applications", "IRB Documentation", "Course Syllabi"],
      },
      {
        id: "academic_presentations",
        name: "Conference Slides & Posters",
        targetFolder: "Presentations/Conference_Posters & Decks",
        keywords: ["poster", "slides", "keynote", "talk", "symposium", "conference", "colloquium"],
        extensions: [".pptx", ".key", ".pdf"],
        subcategories: ["Poster Sessions", "Slide Presentations"],
      },
    ],
  },

  studio_artist: {
    id: "studio_artist",
    name: "Studio Artist & Game Designer",
    tagline: "For 3D modelers, concept artists, level designers, and game devs",
    description: "Crafted for Blender files, substance textures, concept art, sprites, shader materials, and Unreal/Unity development assets.",
    iconName: "Palette",
    defaultNamingPattern: "original_clean",
    categories: [
      {
        id: "artist_3d_models",
        name: "3D Meshes, Renders & Rigging",
        targetFolder: "Art/3D_Meshes & Renders",
        keywords: ["mesh", "lowpoly", "highpoly", "render", "rig", "turntable", "sculpt", "blend", "obj", "fbx", "stl", "gltf", "glb", "subdivision"],
        extensions: [".blend", ".obj", ".fbx", ".stl", ".gltf", ".glb", ".c4d", ".ma", ".mb"],
        subcategories: ["Blender Files", "Exported Meshes", "Renders", "Rigs & Skeletons"],
      },
      {
        id: "artist_textures_materials",
        name: "PBR Textures & Materials",
        targetFolder: "Art/Textures & PBR_Materials",
        keywords: ["texture", "albedo", "normal", "roughness", "metallic", "ambient_occlusion", "height", "pbr", "substance", "displacement", "seamless"],
        extensions: [".png", ".tga", ".exr", ".hdr", ".sbsar", ".sbs", ".jpg"],
        subcategories: ["PBR Maps", "Substance Materials", "HDRI Environments"],
      },
      {
        id: "artist_concept_art",
        name: "Concept Art & Visual Ideation",
        targetFolder: "Art/Concept_Art & Sketches",
        keywords: ["sketch", "concept", "moodboard", "speedpaint", "character_design", "environment_art", "storyboard", "composition", "studies"],
        extensions: [".psd", ".clip", ".procreate", ".png", ".jpg"],
        subcategories: ["Sketches", "Environment Concepts", "Character Concepts", "Moodboards"],
      },
      {
        id: "artist_game_assets",
        name: "Game Assets, Sprites & VFX",
        targetFolder: "GameDev/Assets & Visual_FX",
        keywords: ["sprite", "spritesheet", "tileset", "pixel", "vfx", "particle", "animation", "ui_atlas", "game_ready", "prop"],
        extensions: [".png", ".ase", ".aseprite", ".json", ".svg"],
        subcategories: ["Sprite Sheets", "Tilesets", "VFX & Particles"],
      },
      {
        id: "artist_audio_soundtrack",
        name: "Game Soundtracks & Foley SFX",
        targetFolder: "GameDev/Audio & Soundtrack",
        keywords: ["soundtrack", "ost", "theme", "boss", "ambient", "foley", "hit", "jump", "explosion", "loop", "ambience"],
        extensions: [".wav", ".ogg", ".mp3", ".flac"],
        subcategories: ["Music Loops", "Sound FX", "Ambience"],
      },
    ],
  },
};

/**
 * Combines categories across multiple activated niches, intelligently deduplicating
 * by targetFolder or id and merging keywords/extensions so categories work seamlessly together.
 */
export function getCombinedCategories(
  nicheIds: NicheProfileId[],
  customCategories: CategoryWhitelistItem[] = []
): CategoryWhitelistItem[] {
  if (!nicheIds || nicheIds.length === 0) {
    nicheIds = ["unconventional_polymath"];
  }

  const categoryMap = new Map<string, CategoryWhitelistItem>();

  for (const id of nicheIds) {
    const profile = NICHE_PROFILES[id];
    if (!profile) continue;

    for (const cat of profile.categories) {
      const key = cat.targetFolder.toLowerCase();
      const existing = categoryMap.get(key);

      if (!existing) {
        // Clone item
        categoryMap.set(key, {
          ...cat,
          keywords: [...cat.keywords],
          extensions: [...cat.extensions],
          subcategories: cat.subcategories ? [...cat.subcategories] : undefined,
        });
      } else {
        // Merge keywords & extensions
        const mergedKeywords = Array.from(new Set([...existing.keywords, ...cat.keywords]));
        const mergedExtensions = Array.from(new Set([...existing.extensions, ...cat.extensions]));
        const mergedSub = Array.from(
          new Set([...(existing.subcategories || []), ...(cat.subcategories || [])])
        );

        categoryMap.set(key, {
          ...existing,
          keywords: mergedKeywords,
          extensions: mergedExtensions,
          subcategories: mergedSub.length > 0 ? mergedSub : undefined,
        });
      }
    }
  }

  // Append any user-created custom categories that aren't already represented
  for (const custom of customCategories) {
    const key = custom.targetFolder.toLowerCase();
    if (!categoryMap.has(key)) {
      categoryMap.set(key, custom);
    }
  }

  return Array.from(categoryMap.values());
}
