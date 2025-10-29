# Cost-Optimized AWS Configuration for AgentHub
# Estimated cost: ~$20/month

# EC2 Instance (API Server)
resource "aws_instance" "agenthub_api" {
  ami           = "ami-0c02fb55956c7d316" # Amazon Linux 2023
  instance_type = "t3.micro"              # $7.59/month
  
  vpc_security_group_ids = [aws_security_group.agenthub_sg.id]
  key_name              = var.key_pair_name
  
  user_data = file("user-data.sh")
  
  root_block_device {
    volume_size = 20  # $2.00/month
    volume_type = "gp3"
  }
  
  tags = {
    Name = "AgentHub-API-Server"
    Environment = "production"
    CostCenter = "agenthub"
  }
}

# S3 Bucket (Storage)
resource "aws_s3_bucket" "agenthub_storage" {
  bucket = "agenthub-storage-${random_id.bucket_suffix.hex}"
  
  tags = {
    Name = "AgentHub-Storage"
    CostCenter = "agenthub"
  }
}

# Lambda Function (Agent Executor)
resource "aws_lambda_function" "agent_executor" {
  filename         = "agent-executor.zip"
  function_name    = "AgentHub-Executor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  memory_size     = 256  # Minimal memory for cost optimization
  timeout         = 30
  
  tags = {
    CostCenter = "agenthub"
  }
}

# API Gateway (REST API)
resource "aws_api_gateway_rest_api" "agenthub_api" {
  name        = "AgentHub-API"
  description = "AgentHub REST API"
  
  tags = {
    CostCenter = "agenthub"
  }
}

# CloudWatch Log Group (Basic logging)
resource "aws_cloudwatch_log_group" "agenthub_logs" {
  name              = "/aws/agenthub/api"
  retention_in_days = 7  # Short retention for cost savings
  
  tags = {
    CostCenter = "agenthub"
  }
}

# Security Group
resource "aws_security_group" "agenthub_sg" {
  name_prefix = "agenthub-"
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ip]  # Restrict SSH to your IP
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Cost allocation tags
resource "aws_default_tags" "default" {
  tags = {
    Project     = "AgentHub"
    Environment = "production"
    CostCenter  = "agenthub"
    Owner       = "development-team"
  }
}