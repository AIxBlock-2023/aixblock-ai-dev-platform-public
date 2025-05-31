**Breaking: AIxBlock transitions to open-source. Please follow us for more updates. Here is a brief overview of our project.**

# AIxBlock


**The first unified platform for end-to-end Al development and automation workflows — MCP compatible**

---

## 🚀 What is AIxBlock?
AIxBlock is the first unified platform for end-to-end AI development and workflow automation — modular, interconnected, and built for custom AI. Powered by MCP and decentralized resources, it lets you build & deploy custom models, automate AI workflows, and monetize every step.
Modular, interconnected, and built for custom AI, it's designed for AI engineers and dev teams who want everything in one stack:
- **Data Engine**:
Unified pipeline for data crawling, curation, and automated large-scale labeling with humans in the loop, supporting any kinds of models including multimodal.
- **Low-Code AI Workflow Automation**: (will opensource soon in 1-2weeks)
Create and manage any AI workflow automation. You can also train/fine-tune AI models directly on workflows
- **Distributed Parallel Training (with MoE Support)**:
Train AI models across decentralized compute nodes with auto-configuration, MoE model support.
- **Decentralized Compute Marketplace**:
Access a global pool of underutilized GPU resources at zero margin, enabling cost-effective, scalable AI training.
- **Decentralized Model Marketplace**: 
Buy, sell, and reuse fine-tuned models within a peer-powered ecosystem — accelerating innovation and monetization.
- **Decentralized automation workflow templates Pool**:
AIxBlock lets you monetize your AI automation workflows—whether they're built on AIxBlock, Make.com, Zapier, or n8n.
- **MCP Integration Layer**:
Easily connect AIxBlock’s AI ecosystem to third-party environments and dev platforms that support MCP — enabling flexible workflows across apps and IDEs.


---

## 🌟 How Does It Work ?
 [Data] → [Label] → [Train] → [Deploy] → [Use/Automate]  → [Monetize]
 
①  Bring Your Data or Use our Crawler
- Collect, curate, and label structured or unstructured data — all in one place.
- Use our built-in Data Crawler or pull from data from: local files, your storage, GitHub, Hugging Face, Roboflow, Kaggle, and any other apps
- Tap into a global workforce of 170,000+ labelers
Coming soon: Decentralized data pool

② Label It Your Way
- Define your own input/output dataset formats. Customize your labeling UI including multimodal.
- Support  all data format, including multimodals (Images | Text | Audio | Video | Multimodal).

③  Train at Scale
- Train your custom models at scale — without setting up your own infrastructure.
- Distributed Data Parallel (DDP) built-in
- Built in MLOps tools
- Auto training & active learning optimization
- Connect to Hugging Face, Git, Roboflow, S3, etc — pull and store models easily

④ Use Decentralized Resources
- On-Demand High-End Compute at up to 90% cheaper
- Global Labeling Workforce across 100+ Countries
- Pre-trained AI/ML Models Marketplace 
- AI automation workflow templates
- AI Dataset Pool (soon)
⑤  Deploy models
- Test models in a built-in real-time demo environment & Deploy them
- Or Use it on any MCP-compatible clients:
Cursor
Claude
WindSurf
Any of your own MCP clients

⑥ Automate Workflows
- Build AI automation workflows with your custom models:
- Use our our built-in AI automation workflow builder to connect models to APIs, CRMs, and any apps/environment of your choice
- Run your own models or rent from the marketplace — full flexibility, zero vendor lock-in

⑦ Monetize It All
- Turn every part of your workflow into income.
- Monetize your models
- Rent out idle GPU compute
- Offer services (labeling, fine-tuning, automation)
- Monetize AI automation workflow templates no matter where did you build it (n8n, make.com, zapier, etc)
- (Coming soon) Contribute datasets

---

## 🛠️ Getting Started

1. **Requirements:**

   - Python 3.10
   - [NVM](https://github.com/nvm-sh/nvm)
   - PostgreSQL
   - Redis

2. **Clone the Repository**:

   ```bash
   git clone https://github.com/<your-org>/aixblock.git
   cd aixblock
   ```

3. **Install Dependencies**:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   venv\Scripts\activate     # On Windows
   ```
   
   Install dependencies from `requirements.txt`:

   ```bash
   pip install -r requirements.txt
   ```

   Copy the example environment file and generate a random secret key:

   ```bash
   cp .env.example .env
   # Generate a random SECRET_KEY and replace the placeholder in .env
   # For Linux/macOS:
   sed -i '' -e "/^SECRET_KEY=/s/=.*/=`openssl rand -hex 32`/" .env > /dev/null 2>&1
   # For Windows (using PowerShell):
   # (Get-Content .env) -replace '^SECRET_KEY=.*', ("SECRET_KEY=" + (-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | % {[char]$_}))) | Set-Content .env
   ```

4. **Workflow**:

   Install dependencies for the first time

   ```bash
   make install-workflow
   ```

   Run workflow

   ```bash
   make workflow-engine    # 1st terminal
   make workflow-backend   # 2nd terminal
   make workflow-frontend  # 3rd terminal
   ```

5. **Run the Platform**:

   Setup project for the first time

   ```bash
   make setup
   ```

   Run the project - open two terminals

   ```bash
   make worker  # 1st terminal
   make run     # 2nd terminal
   ```

   **Note**: Always run the workflow before the platform to avoid database lock.

---

## 🤝 How to Contribute

1. Check the [Issues](#) for open tasks.
2. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Submit a Pull Request with detailed notes.

---

## 🎁 Community Contribution Rewards

- Earn points for every meaningful contribution.
- Accumulate points that will be converted into tokens during our Token Generation Event (TGE).
- Post-TGE, receive monthly rewards based on your contribution level.
- Be part of our long-term profit-sharing ecosystem for every single contribution.
To foster sustainable growth and reward valuable contributions, we allocate 15% of the total token supply for ecosystem growth. This allocation is divided into two main categories:

1. Grants and Funding for Outstanding Projects (35%)
2. Open-Source Contributor Rewards (65%)

This section outlines the mechanisms for allocating these tokens, including how contributions are rewarded, thresholds to ensure fairness, and strategies for maintaining reserves.

---

1. Grants and Funding for Outstanding Projects (35%)

We dedicate 35% of the ecosystem growth allocation to fund innovative and impactful projects built on top of our ecosystem. These grants are designed to:

* Support developers creating tools, applications, or integrations that expand the ecosystem's functionality.
* Encourage research and development of new use cases for the platform.
* Drive education, community growth, and user adoption through hackathons, tutorials, and outreach efforts.

---

2. Open-Source Contributor Rewards (65%)

We allocate 65% of the ecosystem growth tokens to reward contributors for their efforts in maintaining and improving the open-source ecosystem. This ensures that contributors are fairly compensated for their time and expertise while fostering innovation and collaboration.

The contributions are categorized and weighted as follows:					

<img width="620" alt="Screenshot 2025-01-13 at 20 50 44" src="https://github.com/user-attachments/assets/141ecd1d-afa3-4a4b-a4dd-d2901cf1a40e" />

---

3. Monthly Token Distribution

Every month, a fixed number of tokens from the open-source contributor pool are unlocked and distributed based on the total points earned by contributors during that period.

Fairness Mechanism: Threshold for Token Distribution

To prevent scenarios where only a small number of contributors claim all tokens with minimal effort, we implement a threshold system:

* Minimum Points Threshold: If the total points earned by all contributors in a given month are less than 500 points, a reduced ratio of 50% of the monthly token allocation will be distributed. The remaining tokens will be added to a community reserve fund.
  * Reasoning: A threshold of 500 points ensures that contributions reach a baseline level of activity and effort. Distributing only 50% of the allocation incentivizes more participation in subsequent months while maintaining fairness.

Point-to-Token Calculation:

Tokens are distributed proportionally based on the points earned:

Example Calculation:

* Monthly Token Pool: 10,000 tokens (for detailed monthly vesting, please check our [whitepaper](https://coda.io/d/AIxBlock-Whitepaper_dobsJ2CuzGN/8-Tokenomics-Plan-Stake-and-Rewards-AxB-token_suP19Gor#_lu8hiyLK)
* Total Contributor Points: 1,000 points
* Contributor A's Points: 100 points → He earns: 100*10000/1000 tokens (equal to 1k tokens)

If the total points were below the threshold (e.g., 400 points):

* Only 50% of the monthly token pool (5,000 tokens) would be distributed.
* Contributor A's Token Share with reduced distribution. → He earns: 100*5000/400 tokens (equal to 1250 tokens)


---

## 💬 Join the Community

- **Discord**: [Join Us](https://discord.gg/nePjg9g5v6)
- **Twitter**: [Follow Us](https://x.com/AixBlock)
- **Telegram**: [Join the Discussion](https://t.me/AIxBlock)
- **LinkedIn**: [Follow Us](https://www.linkedin.com/company/aixblock/)
- **YouTube**: [Watch Our Channel](https://www.youtube.com/@AIXBlock)
- **Website**: https://aixblock.io
- **Platform**: https://app.aixblock.io
- **Huggingface**: https://huggingface.co/AIxBlock

---
## 🔖 Keywords
ai, llm, decentralized-ai, generative-ai, asr, computer-vision, nlp, privacy, security, open-source, distributed-computing, ddp, distributed-training, distributed-data-parrallel, self-hosted-ai platform, decentralized-dataset-pool, self-hosted-labeling-tool, self-hosted-ai-deployment, fine-tuning, ai-development-platform, ai-production-platform


## ⭐ Show Your Support

Give this repository a ⭐ and share it with your network to help grow the AIxBlock community.
```
