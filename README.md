STEP 1 — Install tools on your PC (Git Bash)
bash# Install these if you don't have them
# Terraform: https://developer.hashicorp.com/terraform/install
# AWS CLI:   https://aws.amazon.com/cli/
# kubectl:   https://kubernetes.io/docs/tasks/tools/

# Verify
terraform --version
aws --version
kubectl version --client

STEP 2 — Configure AWS CLI
bashaws configure
# AWS Access Key ID:     your-access-key
# AWS Secret Access Key: your-secret-key
# Default region:        us-east-1
# Default output:        json

STEP 3 — Create state bucket (one time, Git Bash)
aws s3 mb s3://listenme-terraform-state --region us-east-1
aws s3api put-bucket-versioning \
  --bucket listenme-terraform-state \
  --versioning-configuration Status=Enabled

### STEP 4 — Edit terraform.tfvars (Git Bash)
Open `terraform/terraform.tfvars` and fill in your DB password:
```
db_password = "YourStrongPassword123!"

cd terraform

# Download the required ALB controller IAM policy file
curl -Lo alb-controller-policy.json \
  https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Init, plan, apply
terraform init
terraform plan
terraform apply
# Type: yes
# Wait ~20 minutes for EKS to create
```
