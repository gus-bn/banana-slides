// Preset PPT Style Description Configuration

export interface PresetStyle {
    id: string;
    name: string;
    description: string; // The description here has been updated to detailed AI text-to-image prompts
    previewImage?: string; // Optional preview image path
  }
  
  export const PRESET_STYLES: PresetStyle[] = [
    {
      id: 'business-simple',
      name: 'Minimalist Business',
      // Alternative: Background color can be changed to deep "Navy Blue" (#0B1F3B), in which case foreground should be pure white (#FFFFFF).
      description: `Visual Description: The global visual language should reflect the professionalism and stability of top international consulting firms (such as McKinsey or BCG). The overall style pursues extreme flatness and a sense of order, rejecting superfluous decoration and emphasizing clear information transmission. The lighting environment should be uniform studio diffused light, without obvious dramatic shadows, ensuring the picture is clean and translucent.
  
 Color & Material: The background color must be locked to a deep, authoritative "Navy Blue" (#0B1F3B), while foreground elements use pure white (#FFFFFF) with traces of Sky Blue (#38BDF8) as accents; materials should avoid complex textures, using matte paper texture or smooth vector color blocks.
  
  Content & Layout: The layout logic follows a strict modular grid system. Please generate clear geometric partitions, using thin lines or faint Light Gray (#E5E7EB) color blocks to divide content areas. For fonts, apply strong sans-serif fonts (such as Helvetica or Roboto) for headings, keeping body text slender and clear. Chart elements should be flat 2D vector graphics, such as simple bar charts or pie charts, with a single and restrained color scheme.
  
  Rendering Requirements: Vector illustration style, extremely high definition, ensuring sharp and anti-aliased edges for both text and graphics, demonstrating rigorous business aesthetics, suitable for Fortune 500 corporate reporting scenarios.`,
      previewImage: '/preset-previews/business-simple.webp',
    },
    {
      id: 'tech-modern',
      name: 'Modern Tech',
      // Alternative: Background color can be changed to "Deep Space Gray" (#1F2937); elements can be changed to "tetrahedrons" or "chip structures"; textures can be changed to "circuit boards" or "binary code streams".
      description: `Visual Description: The global visual language should blend Cyberpunk with the futuristic feel of modern SaaS products. The overall atmosphere is mysterious, profound, and dynamic, as if in a high-tech data center or virtual space. Lighting uses self-luminous effects in a dark environment, simulating the glow of neon tubes and lasers.
  
 Color & Material: The background color uses a deep "Midnight Black" (#0B0F19) to set off the brightness of the foreground. The main tone uses a linear gradient of high-saturation "Electric Blue" (#00A3FF) and "Cyber Purple" (#7C3AED) to create a sense of flowing energy. Materials make extensive use of semi-transparent glass, glowing grid lines, and geometric bodies with metallic luster.
  
  Content & Layout: The screen should contain floating 3D geometric elements (such as cubes, tetrahedrons, or chip structures) with Wireframe rendering effects. The layout tends towards asymmetrical dynamic balance, using tech-style monospaced fonts or modern sans-serifs. Circuit board textures, binary code streams, or dot matrix maps can be faintly added to the background as decoration to increase detail density.
  
  Rendering Requirements: Octane Render style, emphasizing ray tracing, Bloom effects, and depth of field control, presenting fine particle effects and a visual impact full of technological tension.`,
      previewImage: '/preset-previews/tech-modern.webp',
    },
    {
      id: 'academic-formal',
      name: 'Rigorous Academic',
      // Alternative: Background color can be changed to "Cool Gray" (#F2F4F7); accent color can be changed to "Deep Blue" (#1E3A8A).
      description: `Visual Description: The global visual language should imitate the layout style of high-quality printed publications or classic papers, conveying rationality, objectivity, and the weight of knowledge. The overall atmosphere is quiet and restrained, without any glare or over-design that distracts the line of sight. The picture must fill the full screen, strictly forbidding book binding lines, paper edges, curled corners, shadows, or any form of borders. The background should not present a 3D effect but should be presented in a 2D planar way.
  
 Color & Material: The background color is strictly limited to "Off-white" (#F8F7F2), simulating the texture of high-grade Daolin paper. The foreground uses only pure black (#000000), deep Charcoal (#1F2937), and Deep Red (#7F1D1D) or Deep Blue (#1E3A8A) as accent colors (this accent color accounts for no more than 5%). Materials fully present high-quality paper printing effects with delicate paper textures.
  
  Content & Layout: The layout must follow classic typographic design principles, with wide margins. Please use serif fonts (similar to Times New Roman or Garamond) to reflect tradition and formality. Visual elements mainly consist of fine black line frames (Black, #000000), standard academic table styles, and black and white line art illustrations (Black, #000000 / White, #FFFFFF). The layout uses a rigorous alignment of left-right columns or top-bottom structures.
  
  Rendering Requirements: Ultra-high-resolution scan style, emphasizing grayscale anti-aliasing of fonts and sharpness of lines, the picture is like the inner page of a hardcover academic journal, demonstrating absolute professionalism and authority. There should not be any form of page borders, such as black borders or shadow edge lines.`,
      previewImage: '/preset-previews/academic-formal.webp',
    },
    {
      id: 'creative-fun',
      name: 'Creative Fun',
      // Alternative: Background color can be changed to "Warm Yellow" (#FFD54A); style can be changed to "paper cut style" or "rough edge illustration".
      description: `Visual Description: The global visual language should look like a pitch deck for a vibrant startup or a children's educational app interface. The overall atmosphere is relaxed, joyful, and full of imagination, breaking the shackles of convention. The lighting is bright and sunny, with no shadows between colors, presenting complete flatness.
  
 Color & Material: The background color uses high-brightness "Warm Yellow" (#FFD54A). The color scheme is extremely bold, mixing vivid "Vibrant Orange" (#FF6A00), "Grass Green" (#22C55E), and "Sky Blue" (#38BDF8) to form a Memphis style contrasting color effect. Materials simulate hand-drawn doodles, paper cuts, or rough-edged vector illustrations.
  
  Content & Layout: The screen content should contain hand-drawn style illustration elements, such as doodle arrows, stars, wavy lines, and irregular organic shape color blocks. The layout allows text to tilt, overlap, or jump, breaking the rigid grid. Fonts use rounded and cute rounded or handwritten fonts. Please place some anthropomorphic cute objects or exaggerated speech bubbles in the corners.
  
  Rendering Requirements: Dribbble popular illustration style, bright flat colors, smooth and elastic lines, visually giving a happy, friendly, and very approachable feeling.`,
      previewImage: '/preset-previews/creative-fun.webp',
    },
    {
      id: 'minimalist-clean',
      name: 'Minimalist Clean',
      // Alternative: Visual anchor can be changed to "minimalist photography"; material can be changed to "marble texture".
      description: `Visual Description: The global visual language draws on Scandinavian Design and Kinfolk magazine aesthetics. The overall atmosphere is ethereal and quiet, emphasizing the philosophy of "less is more". Lighting uses extremely soft diffuse skylight, with very faint and blurred shadows, creating a sense of airiness.
  
  Color & Material: The background color is extremely light "Haze Gray" (#F5F5F7). The foreground uses only Mid Gray (#6B7280) and low-saturation Morandi colors (such as Morandi Gray Blue, #7A8FA6) as tiny accents. Materials reflect delicate matte textures, occasionally with a little Plaster micro-texture.
  
  Content & Layout: The core of the composition is "Negative Space", which should occupy more than 70% of the picture. The layout is extremely restrained, with small font sizes, wide line spacing, and slender and elegant sans-serif fonts. Visual anchors are icons composed of simple geometric lines, pursuing absolute balance in layout.
  
  Rendering Requirements: Minimalist photography style, High Dynamic Range (HDR), the picture is extremely clean without any noise, demonstrating a gallery-like artistic display sense.`,
      previewImage: '/preset-previews/minimalist-clean.webp',
    },
    {
      id: 'luxury-premium',
      name: 'Luxury Premium',
      // Alternative: Background color can be changed to "Dark Green" or "Burgundy"; foreground can be changed to "Rose Gold"; material can be changed to "Marble" or "Black Galaxy Granite".
      description: `Visual Description: The global visual language should blend the brand image of high-end watch advertisements or five-star hotels. The overall atmosphere is mysterious, noble, and unique. Lighting uses dramatic Rembrandt lighting or spotlight effects to highlight key elements, leaving the rest in darkness.
  
  Color & Material: The background color is strictly locked to deep "Obsidian Black" (#0B0B0F). The foreground is mainly composed of "Champagne Gold" (#F7E7CE). Materials must reflect expensive tactile sensations, with the core combination being: background presenting matte black velvet texture, foreground decoration presenting brushed metal texture.
  
  Content & Layout: The layout uses classic center alignment or symmetrical layout, emphasizing a sense of ritual. Fonts must use elegant Serif fonts, with appropriately widened letter spacing to reflect dignity. Detailed gold border lines and Art Deco style decorative patterns can be added to the picture. If there are 3D objects, they should present a jewelry-like polished texture.
  
  Rendering Requirements: Cinematic realistic rendering, emphasizing physical properties of materials (PBR), especially metal specular reflections and velvet diffuse reflection details, presenting the high-level texture of luxury goods advertising blockbusters.`,
      previewImage: '/preset-previews/luxury-premium.webp',
    },
    {
      id: 'nature-fresh',
      name: 'Nature Fresh',
      // Alternative: Background color can be changed to "Sage Green" or "Linen"; elements can be changed to "pebbles" or "water droplets".
      description: `Visual Description: The global visual language aims to evoke people's yearning for nature, environmental protection, and healthy living, similar to the brand vision of Whole Foods or Aesop. The overall atmosphere is healing, breathable, and organic. Lighting simulates dappled sunlight (Tyndall effect) passing through leaves in the early morning, warm and soft.
  
  Color & Material: The background color uses soft "Beige" (#EAD9C6). The color scheme is taken from nature, focusing on Forest Green (#14532D) and Earth Brown (#7A4E2D). Materials emphasize natural textures, such as the graininess of recycled paper and the veins of plant leaves.
  
  Content & Layout: The picture should integrate real natural elements, mainly extending green plant leaves, which can serve as background decorations or foreground frames. The layout uses rounded and affinity-rich fonts. The layout can be slightly loose, imitating the form of natural growth. Shadow processing should be soft and natural, avoiding harsh black projections.
  
  Rendering Requirements: Macro photography style combined with 3D rendering, emphasizing the translucency (Subsurface Scattering) of plant surfaces and delicate textures of natural materials, the picture is fresh and elegant, making people feel refreshed.`,
      previewImage: '/preset-previews/nature-fresh.webp',
    },
    {
        id: 'gradient-vibrant',
        name: 'Gradient Vibrant',
        // Alternative: Color scheme can be changed to "Sunset Orange-Purple"; material can be changed to "Silk Luster".
        description: `Visual Description: The global visual language benchmarks the official website visuals of modern tech unicorn companies (such as Stripe or Linear), presenting a flowing beauty like an aurora. The overall atmosphere is dreamy, transparent, and breathable, avoiding harsh contrasting colors and emphasizing the elegant fusion between colors.

  Color & Material: The background is the foreground, using a full-screen diffuse gradient color. The color scheme adopts an elegant and harmonious "Holographic Color System", based on deep "Royal Blue" (#2563EB), smoothly transitioning to "Violet" (#7C3AED) and bright "Magenta" (#DB2777). Colors blend like watercolors without hard boundaries. Materials are locked to "Frosted Glass" texture, making colors look like they are revealing through a layer of matte screen, adding a hazy high-level sense. Illustrations use textured semi-3D color designs.

  Content & Layout: The core of the screen is slowly flowing organic wave shapes with soft and natural forms. The layout uses bold Sans-serif fonts, with text color as pure white (#FFFFFF) to ensure absolute clarity on colorful backgrounds. Interface elements adopt "Glassmorphism", i.e., high-transparency white rounded cards with delicate white strokes and background blur effects.

  Rendering Requirements: C4D fluid simulation rendering, emphasizing "silk"-like smooth luster, combined with slight Grain to increase texture, colors are saturated but not glaring, demonstrating shimmering modern digital aesthetics.`,
        previewImage: '/preset-previews/gradient-vibrant.webp',
      },
  ];
  