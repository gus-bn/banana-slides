<div align="center">

<img width="256" src="https://github.com/user-attachments/assets/6f9e4cf9-912d-4faa-9d37-54fb676f547e">

*Vibe your PPT like vibing code.*

**[中文](README_CN.md) | English**

<p>

[![GitHub Stars](https://img.shields.io/github/stars/Anionex/banana-slides?style=square)](https://github.com/Anionex/banana-slides/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Anionex/banana-slides?style=square)](https://github.com/Anionex/banana-slides/network)
[![GitHub Watchers](https://img.shields.io/github/watchers/Anionex/banana-slides?style=square)](https://github.com/Anionex/banana-slides/watchers)

[![Version](https://img.shields.io/badge/version-v0.3.0-4CAF50.svg)](https://github.com/Anionex/banana-slides)
![Docker](https://img.shields.io/badge/Docker-Build-2496ED?logo=docker&logoColor=white)
[![GitHub issues](https://img.shields.io/github/issues-raw/Anionex/banana-slides)](https://github.com/Anionex/banana-slides/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/Anionex/banana-slides)](https://github.com/Anionex/banana-slides/pulls)


</p> 

<b>A native AI PPT generation application based on nano banana pro🍌, supporting generation of complete PPT presentations from ideas/outlines/page descriptions,<br></b>
<b> automatically extracting attachment charts, uploading any materials, making verbal revisions, moving towards true "Vibe PPT" </b>

<b>🎯 Lowering the threshold for PPT creation, allowing everyone to quickly create beautiful and professional presentations</b>

<br>

*If this project is useful to you, welcome to star🌟 & fork🍴*

<br>

</p>

</div>



## ✨ Project Origin
Have you ever been in such a dilemma: reporting tomorrow, but the PPT is still blank; countless brilliant ideas in mind, but all enthusiasm is worn away by tedious layout and design?

We yearn to quickly create presentations that are both professional and designed. Traditional AI PPT generation apps, although generally satisfying the "fast" requirement, still have the following problems:

- 1️⃣ Only preset templates can be selected, unable to adjust styles flexibly
- 2️⃣ Low freedom, difficult to make multi-round revisions
- 3️⃣ Finished products look similar, serious homogenization
- 4️⃣ Low quality of materials, lack of pertinence
- 5️⃣ Disjointed text and image layout, poor design sense

These defects make traditional AI PPT generators difficult to simultaneously satisfy our two major PPT creation needs of "fast" and "beautiful". Even if they claim to be Vibe PPT, in my eyes they are far from "Vibe".

However, the emergence of the nano banana🍌 model has changed everything. I tried using 🍌pro for PPT page generation and found that the generated results, whether in quality, aesthetics, or consistency, are very good, and can almost accurately render all text required by the prompt + follow the style of the reference image. So why not build a native "Vibe PPT" application based on 🍌pro?

## 👨‍💻 Applicable Scenarios

1. **Beginners**: Zero threshold to quickly generate beautiful PPTs, no design experience needed, reducing the trouble of template selection
2. **PPT Professionals**: Reference AI-generated layouts and text-image combinations to quickly get design inspiration
3. **Educators**: Quickly convert teaching content into illustrated lesson plan PPTs to improve classroom effects
4. **Students**: Quickly complete assignment presentations, focusing on content rather than layout beautification
5. **Business Professionals**: Quickly visualize business proposals and product introductions, adapt to multiple scenarios quickly


## 🎨 Result Cases


<div align="center">

| | |
|:---:|:---:|
| <img src="https://github.com/user-attachments/assets/d58ce3f7-bcec-451d-a3b9-ca3c16223644" width="500" alt="Case 3"> | <img src="https://github.com/user-attachments/assets/c64cd952-2cdf-4a92-8c34-0322cbf3de4e" width="500" alt="Case 2"> |
| **Software Development Best Practices** | **DeepSeek-V3.2 Technology Showcase** |
| <img src="https://github.com/user-attachments/assets/383eb011-a167-4343-99eb-e1d0568830c7" width="500" alt="Case 4"> | <img src="https://github.com/user-attachments/assets/1a63afc9-ad05-4755-8480-fc4aa64987f1" width="500" alt="Case 1"> |
| **R&D and Industrialization of Intelligent Production Line Equipment for Pre-prepared Dishes** | **Evolution of Money: From Shells to Paper Currency** |

</div>

More visible in <a href="https://github.com/Anionex/banana-slides/issues/2" > Use Cases </a>


## 🎯 Feature Introduction

### 1. Flexible and Diverse Creation Paths
Supports three starting methods: **Idea**, **Outline**, and **Page Description**, meeting different creation habits.
- **One-sentence Generation**: Enter a topic, AI automatically generates a structured outline and page-by-page content descriptions.
- **Natural Language Editing**: Supports verbal modification of outlines or descriptions in Vibe form (such as "change the third page to case analysis"), AI responds and adjusts in real-time.
- **Outline/Description Mode**: Can generate in batches with one click, or manually adjust details.

<img width="2000" height="1125" alt="image" src="https://github.com/user-attachments/assets/7fc1ecc6-433d-4157-b4ca-95fcebac66ba" />


### 2. Powerful Material Parsing Capability
- **Multi-format Support**: Upload PDF/Docx/MD/Txt and other files, backend automatically parses content.
- **Intelligent Extraction**: Automatically identify key points, image links, and chart information in text to provide rich materials for generation.
- **Style Reference**: Support uploading reference images or templates to customize PPT style.

<img width="1920" height="1080" alt="File Parsing and Material Processing" src="https://github.com/user-attachments/assets/8cda1fd2-2369-4028-b310-ea6604183936" />

### 3. "Vibe" Style Natural Language Modification
No longer limited to complex menu buttons, directly issue modification instructions through **natural language**.
- **Local Redrawing**: Verbally modify unsatisfactory areas (such as "change this chart to a pie chart").
- **Full Page Optimization**: Generate high-definition, consistent style pages based on nano banana pro🍌.

<img width="2000" height="1125" alt="image" src="https://github.com/user-attachments/assets/929ba24a-996c-4f6d-9ec6-818be6b08ea3" />


### 4. Out-of-the-box Format Export
- **Multi-format Support**: One-click export of standard **PPTX** or **PDF** files.
- **Perfect Adaptation**: Default 16:9 ratio, layout requires no secondary adjustment, present directly.

<img width="1000" alt="image" src="https://github.com/user-attachments/assets/3e54bbba-88be-4f69-90a1-02e875c25420" />
<img width="1748" height="538" alt="PPT and PDF Export" src="https://github.com/user-attachments/assets/647eb9b1-d0b6-42cb-a898-378ebe06c984" />

### 5. Freely Editable pptx Export (Beta Iteration)
- **Export images as high-fidelity, clean-background, editable image and text PPT pages**
- Related updates see https://github.com/Anionex/banana-slides/issues/121
<img width="1000"  alt="image" src="https://github.com/user-attachments/assets/a85d2d48-1966-4800-a4bf-73d17f914062" />

<br>

**🌟 Feature Comparison with notebooklm slide deck**
| Feature | notebooklm | This Project | 
| --- | --- | --- |
| Max Pages | 15 pages | **Unlimited** | 
| Secondary Editing | Not supported | **Region selection editing + Verbal editing** |
| Material Addition | Cannot add after generation | **Freely add after generation** |
| Export Format | Only supports export as PDF | **Export as PDF, (Editable) pptx** |
| Watermark | Free version has watermark | **No watermark, freely add/delete elements** |

> Note: Comparison may become outdated as new features are added



## 🔥 Recent Updates
- 【1-4】 : v0.3.0 released: Editable pptx export fully upgraded:
  * Supports maximizing restoration of font size, color, bold and other styles of text in images;
  * Supports recognizing text content in tables;
  * More precise text size and text position restoration logic
  * Optimized export workflow, greatly reducing the phenomenon of residual text in background images after export;
  * Supports page multi-selection logic, flexibly selecting specific pages to generate and export.
  * **Detailed effects and usage methods see https://github.com/Anionex/banana-slides/issues/121**

- 【12-27】: Added support for no-image template mode and high-quality text presets, now can control ppt page style through pure text description
- 【12-24】: main branch added editable pptx export method based on nano-banana-pro background extraction (Currently Beta)


## 🗺️ Development Plan

| Status | Milestone |
| --- | --- |
| ✅ Completed | Create PPT from three paths: idea, outline, page description |
| ✅ Completed | Parse Markdown format images in text |
| ✅ Completed | Add more materials to PPT single page |
| ✅ Completed | Vibe verbal editing of PPT single page selected area |
| ✅ Completed | Material module: material generation, upload, etc. |
| ✅ Completed | Support upload + parsing of multiple files |
| ✅ Completed | Support Vibe verbal adjustment of outline and description |
| ✅ Completed | Preliminary support for editable version pptx file export |
| 🔄 In Progress | Support multi-layer, precise cutout editable pptx export |
| 🔄 In Progress | Web search |
| 🔄 In Progress | Agent Mode |
| 🧭 Planned | Optimize frontend loading speed |
| 🧭 Planned | Online playback function |
| 🧭 Planned | Simple animation and page transition effects |
| 🧭 Planned | Multi-language support |
| 🧭 Planned | User system |

## 📦 Usage

### Using Docker Compose🐳 (Recommended)
This is the simplest deployment method, which can start frontend and backend services with one click.

<details>
  <summary>📒 Windows User Instructions</summary>

If you use Windows, please install Windows Docker Desktop first, check the Docker icon in the system tray, ensure Docker is running, and then use the same steps.

> **Tip**: If you encounter problems, ensure WSL 2 backend is enabled in Docker Desktop settings (recommended), and ensure ports 3000 and 5000 are not occupied.

</details>

0. **Clone Repository**
```bash
git clone https://github.com/Anionex/banana-slides
cd banana-slides
```

1. **Configure Environment Variables**

Create `.env` file (refer to `.env.example`):
```bash
cp .env.example .env
```

Edit `.env` file, configure necessary environment variables:
> **Large model interfaces in the project use AIHubMix platform format as standard, recommend using [AIHubMix](https://aihubmix.com/?aff=17EC) to get API keys, reducing migration costs**  
```env
# AI Provider format configuration (gemini / openai / vertex)
AI_PROVIDER_FORMAT=gemini

# Gemini format configuration (used when AI_PROVIDER_FORMAT=gemini)
GOOGLE_API_KEY=your-api-key-here
GOOGLE_API_BASE=https://generativelanguage.googleapis.com
# Proxy example: https://aihubmix.com/gemini

# OpenAI format configuration (used when AI_PROVIDER_FORMAT=openai)
OPENAI_API_KEY=your-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1
# Proxy example: https://aihubmix.com/v1

# Vertex AI format configuration (used when AI_PROVIDER_FORMAT=vertex)
# Requires GCP service account, can use GCP free tier
# VERTEX_PROJECT_ID=your-gcp-project-id
# VERTEX_LOCATION=global
# GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json
...
```

**Use the new version of editable export configuration method to get better editable export effects**: Need to get API KEY in [Baidu AI Cloud Platform](https://console.bce.baidu.com/iam/#/iam/apikey/list), fill in the BAIDU_OCR_API_KEY field in the .env file (sufficient free usage quota). See instructions in https://github.com/Anionex/banana-slides/issues/121


<details>
  <summary>📒 Using Vertex AI (GCP Free Tier)</summary>

If you want to use Google Cloud Vertex AI (can use GCP new user credits), additional configuration is required:

1. Create a service account in [GCP Console](https://console.cloud.google.com/) and download the JSON key file
2. Rename the key file to `gcp-service-account.json` and place it in the project root directory
3. Edit `.env` file:
   ```env
   AI_PROVIDER_FORMAT=vertex
   VERTEX_PROJECT_ID=your-gcp-project-id
   VERTEX_LOCATION=global
   ```
4. Edit `docker-compose.yml`, uncomment the following:
   ```yaml
   # environment:
   #   - GOOGLE_APPLICATION_CREDENTIALS=/app/gcp-service-account.json
   # ...
   # - ./gcp-service-account.json:/app/gcp-service-account.json:ro
   ```

> **Note**: `gemini-3-*` series models need to set `VERTEX_LOCATION=global`

</details>

2. **Start Services**

```bash
docker compose up -d
```
Update: The project also provides built frontend and backend images on dockerhub (synced with latest version of main branch), named:
1. anoinex/banana-slides-frontend
2. anoinex/banana-slides-backend


> [!TIP]
> If you encounter network problems, you can uncomment the mirror source configuration in the `.env` file, and rerun the start command:
> ```env
> # Uncomment the following in .env file to use domestic mirror sources
> DOCKER_REGISTRY=docker.1ms.run/
> GHCR_REGISTRY=ghcr.nju.edu.cn/
> APT_MIRROR=mirrors.aliyun.com
> PYPI_INDEX_URL=https://mirrors.cloud.tencent.com/pypi/simple
> NPM_REGISTRY=https://registry.npmmirror.com/
> ```


3. **Access Application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

4. **View Logs**

```bash
# View backend logs (real-time view last 50 lines)
sudo docker compose logs -f --tail 50 backend

# View all service logs (last 200 lines)
sudo docker compose logs -f --tail 200

# View frontend logs
sudo docker compose logs -f --tail 50 frontend
```

5. **Stop Services**

```bash
docker compose down
```

6. **Update Project**

Pull latest code and rebuild and start services:

```bash
git pull
docker compose down
docker compose build --no-cache
docker compose up -d
```

**Note: Thanks to excellent developer friend [@ShellMonster](https://github.com/ShellMonster/) for providing [Newbie Deployment Tutorial](https://github.com/ShellMonster/banana-slides/blob/docs-deploy-tutorial/docs/NEWBIE_DEPLOYMENT.md), designed for novices with no server deployment experience, [click link](https://github.com/ShellMonster/banana-slides/blob/docs-deploy-tutorial/docs/NEWBIE_DEPLOYMENT.md) to view.**

### Deploy from Source

#### Requirements
- Python 3.10 or higher
- [uv](https://github.com/astral-sh/uv) - Python package manager
- Node.js 16+ and npm
- Valid Google Gemini API Key

#### Backend Installation

0. **Clone Repository**
```bash
git clone https://github.com/Anionex/banana-slides
cd banana-slides
```

1. **Install uv (if not installed)**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. **Install Dependencies**

Run in project root directory:
```bash
uv sync
```

This will automatically install all dependencies based on `pyproject.toml`.

3. **Configure Environment Variables**

Copy environment variable template:
```bash
cp .env.example .env
```

Edit `.env` file, configure your API key:
> **Large model interfaces in the project use AIHubMix platform format as standard, recommend using [AIHubMix](https://aihubmix.com/?aff=17EC) to get API keys, reducing migration costs** 
```env
# AI Provider format configuration (gemini / openai / vertex)
AI_PROVIDER_FORMAT=gemini

# Gemini format configuration (used when AI_PROVIDER_FORMAT=gemini)
GOOGLE_API_KEY=your-api-key-here
GOOGLE_API_BASE=https://generativelanguage.googleapis.com
# Proxy example: https://aihubmix.com/gemini

# OpenAI format configuration (used when AI_PROVIDER_FORMAT=openai)
OPENAI_API_KEY=your-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1
# Proxy example: https://aihubmix.com/v1

# Vertex AI format configuration (used when AI_PROVIDER_FORMAT=vertex)
# Requires GCP service account, can use GCP free tier
# VERTEX_PROJECT_ID=your-gcp-project-id
# VERTEX_LOCATION=global
# GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account.json

PORT=5000
...
```

#### Frontend Installation

1. **Enter Frontend Directory**
```bash
cd frontend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure API Address**

Frontend automatically connects to `http://localhost:5000` backend service. If modification is needed, please edit `src/api/client.ts`.


#### Start Backend Service
> (Optional) If there is important data locally, it is recommended to back up the database before upgrading:  
> `cp backend/instance/database.db backend/instance/database.db.bak`

```bash
cd backend
uv run alembic upgrade head && uv run python app.py
```

Backend service will start at `http://localhost:5000`.

Access `http://localhost:5000/health` to verify if service is running normally.

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend development server will start at `http://localhost:3000`.

Open browser to access and use the application.


## 🛠️ Technical Architecture

### Frontend Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **State Management**: Zustand
- **Routing**: React Router v6
- **UI Components**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend Tech Stack
- **Language**: Python 3.10+
- **Framework**: Flask 3.0
- **Package Management**: uv
- **Database**: SQLite + Flask-SQLAlchemy
- **AI Capabilities**: Google Gemini API
- **PPT Processing**: python-pptx
- **Image Processing**: Pillow
- **Concurrency**: ThreadPoolExecutor
- **CORS Support**: Flask-CORS

## 📁 Project Structure

```
banana-slides/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Home.tsx        # Home (Create Project)
│   │   │   ├── OutlineEditor.tsx    # Outline Editor
│   │   │   ├── DetailEditor.tsx     # Detail Description Editor
│   │   │   ├── SlidePreview.tsx     # Slide Preview
│   │   │   └── History.tsx          # Version History Management
│   │   ├── components/         # UI Components
│   │   │   ├── outline/        # Outline related components
│   │   │   │   └── OutlineCard.tsx
│   │   │   ├── preview/        # Preview related components
│   │   │   │   ├── SlideCard.tsx
│   │   │   │   └── DescriptionCard.tsx
│   │   │   ├── shared/         # Shared components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── Markdown.tsx
│   │   │   │   ├── MaterialSelector.tsx
│   │   │   │   ├── MaterialGeneratorModal.tsx
│   │   │   │   ├── TemplateSelector.tsx
│   │   │   │   ├── ReferenceFileSelector.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/         # Layout components
│   │   │   └── history/        # History components
│   │   ├── store/              # Zustand state management
│   │   │   └── useProjectStore.ts
│   │   ├── api/                # API interfaces
│   │   │   ├── client.ts       # Axios client config
│   │   │   └── endpoints.ts    # API endpoints definition
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   ├── constants/          # Constants definition
│   │   └── styles/             # Style files
│   ├── public/                 # Static resources
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js      # Tailwind CSS config
│   ├── Dockerfile
│   └── nginx.conf              # Nginx config
│
├── backend/                    # Flask backend application
│   ├── app.py                  # Flask app entry
│   ├── config.py               # Configuration file
│   ├── models/                 # Database models
│   │   ├── project.py          # Project model
│   │   ├── page.py             # Page model (Slide page)
│   │   ├── task.py             # Task model (Async task)
│   │   ├── material.py         # Material model (Reference material)
│   │   ├── user_template.py    # UserTemplate model
│   │   ├── reference_file.py   # ReferenceFile model
│   │   ├── page_image_version.py # PageImageVersion model
│   ├── services/               # Service layer
│   │   ├── ai_service.py       # AI generation service (Gemini integration)
│   │   ├── file_service.py     # File management service
│   │   ├── file_parser_service.py # File parsing service
│   │   ├── export_service.py   # PPTX/PDF export service
│   │   ├── task_manager.py     # Async task management
│   │   ├── prompts.py          # AI prompt templates
│   ├── controllers/            # API controllers
│   │   ├── project_controller.py      # Project management
│   │   ├── page_controller.py         # Page management
│   │   ├── material_controller.py     # Material management
│   │   ├── template_controller.py     # Template management
│   │   ├── reference_file_controller.py # Reference file management
│   │   ├── export_controller.py       # Export functionality
│   │   └── file_controller.py         # File upload
│   ├── utils/                  # Utility functions
│   │   ├── response.py         # Unified response format
│   │   ├── validators.py       # Data validation
│   │   └── path_utils.py       # Path handling
│   ├── instance/               # SQLite database (auto-generated)
│   ├── exports/                # Export file directory
│   ├── Dockerfile
│   └── README.md
│
├── tests/                      # Test file directory
├── v0_demo/                    # Early demo version
├── output/                     # Output file directory
│
├── pyproject.toml              # Python project config (uv managed)
├── uv.lock                     # uv dependency lock file
├── docker-compose.yml          # Docker Compose config
├── .env.example                 # Environment variables example
├── LICENSE                     # License
└── README.md                   # This file
```

## Community
To facilitate communication and mutual help, this WeChat group is established.

Welcome to propose new feature suggestions or feedback, I will also ~~buddhist-style~~ answer everyone's questions.

<img width="301" alt="image" src="https://github.com/user-attachments/assets/6a557e4b-8be5-4946-a6fc-307e0fb0d69c" />





**FAQ**
1.  **Does it support free tier Gemini API Key?**
    *   Free tier only supports text generation, not image generation.
2.  **Prompt 503 error or Retry Error when generating content**
    *   You can check Docker internal logs according to the command in README to locate detailed error of 503 problem, usually caused by incorrect model configuration.
3.  **Why does API Key set in .env not take effect?**
    1.  Editing .env at runtime requires restarting Docker container to apply changes.
    2.  If set in the webpage settings page before, it will overwrite parameters in `.env`, can be restored to `.env` via "Restore Default Settings".
4.  **Generated page text is garbled**
    *   Try higher resolution output (openai format might not support increasing resolution)
    *   Ensure the page description contains specific text content to be rendered
  

## 🤝 Contribution Guide

Welcome to contribute to this project via
[Issue](https://github.com/Anionex/banana-slides/issues)
and
[Pull Request](https://github.com/Anionex/banana-slides/pulls)
!

## 📄 License

This project is open sourced under the CC BY-NC-SA 4.0 license,

Freely usable for personal learning, research, experiment, education or non-profit scientific research activities and other non-commercial uses;

<details> 

<summary> Details </summary>
The open source license of this project is non-commercial license (CC BY-NC-SA),  
Any commercial use requires commercial authorization.

**Commercial use** includes but is not limited to the following scenarios:

1. Internal use by enterprises or institutions:

2. External services:

3. Other profit-making purposes:

**Non-commercial use examples** (no commercial authorization required):

- Personal learning, research, experiment, education or non-profit scientific research activities;
- Open source community contribution, personal work display and other uses that do not generate economic benefits.

> Note: If you have questions about the usage scenario, please contact the author for authorization.

</details>



<h2>🚀 Sponsor </h2>

<div align="center">
<a href="https://aihubmix.com/?aff=17EC">
  <img src="./assets/logo_aihubmix.png" alt="AIHubMix" style="height:48px;">
</a>
<p>Thanks to AIHubMix for sponsoring this project</p>
</div>


<div align="center">


 <img width="120" alt="image" src="https://github.com/user-attachments/assets/ac2ad6ec-c1cf-4aaa-859c-756b54168c96" />

<details>
  <summary>Thanks to <a href="https://api.chatfire.site/login?inviteCode=A15CD6A0">AI Fire Baby</a> for sponsoring this project</summary>
  "Aggregating global multi-model API service providers. Enjoy safe, stable services connecting to the world's latest models in 72 hours at a lower price."
</details>

  
</div>



## Acknowledgements

- Project Contributors:

[![Contributors](https://contrib.rocks/image?repo=Anionex/banana-slides)](https://github.com/Anionex/banana-slides/graphs/contributors)

- [Linux.do](https://linux.do/): New Ideal Community
  
## Appreciation

Open source is not easy 🙏 If this project is valuable to you, welcome to buy the developer a coffee ☕️

<img width="240" alt="image" src="https://github.com/user-attachments/assets/fd7a286d-711b-445e-aecf-43e3fe356473" />

Thanks to the following friends for their free sponsorship support for the project:
> @雅俗共赏、@曹峥、@以年观日、@John、@azazo1、@刘聪NLP、@🍟、@苍何、@biubiu  
> If you have questions about the sponsorship list (e.g. didn't see your name after appreciation), please <a href="mailto:anionex@qq.com">contact the author</a>
 
## 📈 Project Statistics

<a href="https://www.star-history.com/#Anionex/banana-slides&type=Timeline&legend=top-left">

 <picture>

   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Anionex/banana-slides&type=Timeline&theme=dark&legend=top-left" />

   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Anionex/banana-slides&type=Timeline&legend=top-left" />

   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Anionex/banana-slides&type=Timeline&legend=top-left" />

 </picture>

</a>

<br>
