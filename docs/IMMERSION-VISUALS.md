# Visuels immersifs — version noire

Création avec l'outil intégré `image_gen`. Les quatre images sont des visuels d'inspiration, distincts des photos des réalisations MG Pro. Elles sont intégrées sans agrandissement artificiel et sans changement du site blanc ou de l'admin.

| Scène | Fichier servi | Source PNG conservée | Dimensions natives |
| --- | --- | --- | --- |
| Cuisine, ordinateur | `public/images/immersive/vision-desktop.webp` | `design/immersive/vision-desktop.png` | 1672 × 941 |
| Salle de bain, ordinateur | `public/images/immersive/detail-desktop.webp` | `design/immersive/detail-desktop.png` | 1672 × 941 |
| Cuisine, mobile | `public/images/immersive/vision-mobile.webp` | `design/immersive/vision-mobile.png` | 941 × 1672 |
| Salle de bain, mobile | `public/images/immersive/detail-mobile.webp` | `design/immersive/detail-mobile.png` | 940 × 1672 |

Les dimensions demandées dans les prompts ne sont pas les dimensions garanties de sortie : les dimensions réellement obtenues sont celles du tableau. Les WebP de qualité 94 sont préparés avec `scripts/prepare-immersive-images.mjs`. Les sources restent locales au dépôt et sont exclues du paquet Vercel.

## Prompt cuisine, ordinateur

Use case: photorealistic-natural. Create a new premium architectural interior photograph for a full-screen immersive renovation website, MG Pro in Quebec. Single image, landscape 16:9, maximum native resolution, ideally 3840x2160, extremely sharp fine architectural detail. An elegant renovated open-plan kitchen and living room in a contemporary Montreal house: large island with white lightly veined stone, charcoal cabinetry mixed with restrained natural oak, brushed brass tap and slim lighting, floor-to-ceiling windows showing a leafy Canadian garden, believable white oak floor, a refined off-white sofa in foreground. Camera at human eye level, centered composition with deep perspective and straight verticals, large inviting room extending away from viewer. The central third must also make a beautiful portrait crop for phones, showing island, windows and room depth. Natural bright daylight, accurate realistic textures, balanced exposure, luxurious yet inhabited and attainable, architectural magazine photograph, not a CGI render. No people, text, logo, graphics, border, vignette or watermark. Do not imitate any attached screenshot; create an original space. No excessive brown, purple, heavy yellow colour cast, plastic surfaces or distorted furniture.

## Prompt salle de bain, ordinateur

Use case: photorealistic-natural. Create a new premium architectural interior photograph for a full-screen immersive renovation website, MG Pro in Quebec. Single image, landscape 16:9, maximum native resolution, ideally 3840x2160, extremely sharp fine architectural detail. A sophisticated newly renovated master bathroom in a contemporary Montreal home: a spacious seamless glass walk-in shower in the center background, floor-to-ceiling neutral white and charcoal stone with realistic subtle veins, floating double vanity with restrained natural oak and brushed brass fittings, a freestanding sculptural white bathtub near a tall window looking onto leafy trees. Camera at human eye level, deep spacious perspective, perfectly straight verticals, carefully resolved joints, realistic clear glass reflections and natural stone texture. Central third must make a strong portrait crop for phones, showing shower, bathtub and room depth rather than a blank wall. Luminous natural daylight and soft indirect lighting, clean neutral black-white palette with small warm gold accents, inviting and realistic, architectural magazine photograph, not CGI. No people, text, logos, graphics, border, vignette or watermark. Original design. No excessive brown, purple, strong yellow cast, plastic textures, bent lines or implausible plumbing.

## Prompt cuisine, mobile

Image de référence : la cuisine horizontale générée ci-dessus.

Edit target: the supplied original generated kitchen and living room photograph. Create its tall portrait mobile companion image, portrait 9:16 composition, maximum native resolution and extremely fine architectural detail. Preserve the same room, materials, gold fittings, neutral palette and natural daylight, with accurate photographic realism. Reframe naturally for a full-screen phone wallpaper: retain the sense of walking into the space and keep the important furnishings visible in the middle and lower frame, with correct straight architectural lines. Recompose/extend the room where needed instead of stretching the original or creating a blurry enlarged crop. Crisp realistic texture and glass reflections, bright exposure. One single portrait photograph, no text, logo, people, frames, collage, borders or watermark.

## Prompt salle de bain, mobile

Image de référence : la salle de bain horizontale générée ci-dessus.

Edit target: the supplied original generated bathroom photograph. Create its tall portrait mobile companion image, portrait 9:16 composition, maximum native resolution and extremely fine architectural detail. Preserve the same room, materials, gold fittings, neutral palette and natural daylight, with accurate photographic realism. Reframe naturally for a full-screen phone wallpaper: retain the sense of walking into the space and keep the important furnishings visible in the middle and lower frame, with correct straight architectural lines. Recompose/extend the room where needed instead of stretching the original or creating a blurry enlarged crop. Crisp realistic texture and glass reflections, bright exposure. One single portrait photograph, no text, logo, people, frames, collage, borders or watermark.
