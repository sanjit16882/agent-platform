# AI Agents Course - Project Understanding Document

## Overview

This is a comprehensive 6-week course on **Agentic AI Engineering** that teaches students how to build autonomous AI agents using various modern frameworks and tools. The course is designed by Edward Donner and covers practical implementation of AI agents using multiple technologies.

## Course Structure

### 🎯 **Main Objective**
Build autonomous AI agents using OpenAI Agents SDK, CrewAI, LangGraph, AutoGen, and MCP (Model Context Protocol).

### 📚 **6-Week Curriculum**

#### **Week 1: Foundations (1_foundations/)**
- **Focus**: Basic AI agent concepts and OpenAI API integration
- **Key Topics**:
  - Setting up development environment
  - OpenAI API basics and authentication
  - Simple agent interactions
  - Environment variables and API keys
- **Labs**: 4 progressive notebooks (lab1-lab4)
- **Practical Applications**: Basic chatbots, simple task automation

#### **Week 2: OpenAI Agents (2_openai/)**
- **Focus**: Advanced OpenAI Agents SDK features
- **Key Topics**:
  - Multi-agent systems
  - Tool usage and function calling
  - Agent workflows and routing
  - Deep research capabilities
- **Labs**: 4 advanced notebooks
- **Practical Applications**: Research agents, workflow automation, multi-agent collaboration

#### **Week 3: CrewAI (3_crew/)**
- **Focus**: Multi-agent team collaboration using CrewAI
- **Key Topics**:
  - Agent roles and responsibilities
  - Team coordination and communication
  - Task delegation and workflow management
- **Projects**:
  - `debate/` - Multi-agent debate system
  - `financial_researcher/` - Financial analysis team
  - `engineering_team/` - Software development team
  - `stock_picker/` - Investment analysis team
  - `coder/` - Code generation and review team

#### **Week 4: LangGraph (4_langgraph/)**
- **Focus**: Complex agent workflows and state management
- **Key Topics**:
  - Graph-based agent workflows
  - State persistence and memory
  - Conditional routing and decision trees
  - Long-running agent processes
- **Labs**: 4 notebooks covering workflow patterns
- **Practical Applications**: Sidekick agents, complex decision-making systems

#### **Week 5: AutoGen (5_autogen/)**
- **Focus**: Microsoft's AutoGen framework for conversational AI
- **Key Topics**:
  - Conversational agent development
  - Multi-agent conversations
  - Agent chat patterns
  - Distributed agent systems
- **Labs**: 4 notebooks covering AutoGen capabilities
- **Practical Applications**: Conversational AI, collaborative problem-solving

#### **Week 6: MCP (6_mcp/)**
- **Focus**: Model Context Protocol for tool integration
- **Key Topics**:
  - MCP server and client development
  - Tool integration and API connections
  - Custom tool development
  - Agent-tool communication protocols
- **Labs**: 5 notebooks covering MCP implementation
- **Practical Applications**: Trading systems, custom tool integration

## 🛠 **Technical Stack**

### **Core Dependencies** (from pyproject.toml)
- **AI Frameworks**: OpenAI, Anthropic, LangChain ecosystem
- **Agent Frameworks**: CrewAI, LangGraph, AutoGen, OpenAI Agents SDK
- **Development Tools**: Jupyter notebooks, Gradio, Playwright
- **Data Processing**: Pandas, Plotly, Pypdf
- **Communication**: SendGrid, HTTPX, Requests
- **Specialized**: MCP, Semantic Kernel, Polygon API (financial data)

### **Environment Requirements**
- Python 3.12+
- Virtual environment management (uv)
- API keys for various AI services
- Development tools (Cursor IDE recommended)

## 📁 **Project Organization**

### **Main Structure**
```
agents/
├── 1_foundations/          # Week 1: Basic concepts
├── 2_openai/              # Week 2: OpenAI Agents SDK
├── 3_crew/                # Week 3: CrewAI multi-agent teams
├── 4_langgraph/           # Week 4: Workflow and state management
├── 5_autogen/             # Week 5: Conversational AI
├── 6_mcp/                 # Week 6: Tool integration
├── guides/                # Technical foundations and tutorials
├── setup/                 # Environment setup instructions
├── assets/                # Course images and resources
└── community_contributions/ # Student projects and extensions
```

### **Each Week Contains**
- **Lab Notebooks**: Progressive learning exercises
- **Community Contributions**: Real-world applications by students
- **Practical Projects**: Complete working examples
- **Documentation**: Setup guides and troubleshooting

## 🎓 **Learning Approach**

### **Progressive Complexity**
1. **Start Simple**: Basic API calls and single agents
2. **Add Tools**: Function calling and external integrations
3. **Build Teams**: Multi-agent collaboration
4. **Manage State**: Complex workflows and persistence
5. **Enable Conversations**: Natural language interactions
6. **Integrate Everything**: Custom tools and protocols

### **Hands-On Learning**
- **Interactive Notebooks**: Step-by-step coding exercises
- **Real Projects**: Complete working applications
- **Community Examples**: Diverse implementations by students
- **Troubleshooting Guides**: Common issues and solutions

## 🌟 **Key Features**

### **Comprehensive Coverage**
- **Multiple Frameworks**: Not just one tool, but the entire ecosystem
- **Real-World Applications**: Practical projects you can actually use
- **Community-Driven**: Extensive student contributions and examples
- **Production-Ready**: Focus on deployable, scalable solutions

### **Flexible Learning**
- **Multiple AI Providers**: OpenAI, Gemini, DeepSeek, Ollama (free)
- **Cost Considerations**: Guidance on API costs and alternatives
- **Platform Support**: Windows, Mac, Linux setup instructions
- **Skill Levels**: Suitable for beginners to advanced developers

## 🚀 **Practical Applications**

### **Student Projects Include**
- **Business Tools**: Resume analyzers, business idea evaluators
- **Research Agents**: Deep research with clarifying questions
- **Communication**: Slack, Telegram, email integrations
- **Specialized Domains**: Legal advice, protein analysis, security reviews
- **Financial**: Stock picking, market analysis, trading systems
- **Development**: Code generation, debugging, project management

### **Industry-Relevant Skills**
- **API Integration**: Working with multiple AI services
- **System Design**: Multi-agent architecture patterns
- **Tool Development**: Creating custom tools and protocols
- **Deployment**: Production-ready agent systems
- **Cost Optimization**: Managing API usage and alternatives

## 📖 **Supporting Resources**

### **Guides Section** (guides/)
- **Technical Foundations**: Environment setup, APIs, networking
- **Python Skills**: From basics to advanced async programming
- **Development Practices**: Debugging, notebook usage, project structure
- **AI Integration**: Multiple provider support, cost management

### **Setup Instructions** (setup/)
- **Platform-Specific**: Windows, Mac, Linux setup guides
- **Troubleshooting**: Common issues and solutions
- **Environment Management**: Virtual environments and dependencies

## 🎯 **Learning Outcomes**

By completing this course, students will be able to:

1. **Build Autonomous Agents**: Create AI agents that can perform complex tasks
2. **Design Multi-Agent Systems**: Coordinate teams of specialized agents
3. **Integrate External Tools**: Connect agents to real-world APIs and services
4. **Manage Complex Workflows**: Handle state, memory, and decision trees
5. **Deploy Production Systems**: Create scalable, maintainable agent applications
6. **Optimize for Cost and Performance**: Choose appropriate models and tools

## 💡 **Why This Course Matters**

### **Industry Relevance**
- **Growing Demand**: AI agents are becoming essential in modern software
- **Career Opportunities**: Skills in agent development are highly valued
- **Future-Proofing**: Understanding the latest AI frameworks and patterns

### **Practical Value**
- **Immediate Application**: Build useful tools and systems
- **Portfolio Building**: Create impressive projects for job applications
- **Business Impact**: Automate complex workflows and decision-making

This course represents a comprehensive journey from AI agent basics to advanced, production-ready systems, making it an excellent resource for anyone interested in the future of AI-powered applications. 