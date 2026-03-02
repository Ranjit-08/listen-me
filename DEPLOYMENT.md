# ═══════════════════════════════════════════════════════════════
#  AURA Music — Deployment Guide
#  Amazon Linux 2023 EC2 + PostgreSQL on EC2 + S3
#  No SSL required. Zero code changes needed.
# ═══════════════════════════════════════════════════════════════


# ───────────────────────────────────────────────────────────────
# STEP 1 — CREATE S3 BUCKET  (AWS Console)
# ───────────────────────────────────────────────────────────────

# 1. Go to AWS Console → S3 → Create bucket
# 2. Bucket name : aura-music-files-YOURNAME   ← add your name, must be unique
#    Region      : us-east-1
# 3. Object Ownership → ACLs enabled → Bucket owner preferred
# 4. Uncheck ALL four "Block Public Access" boxes → check the confirm box
# 5. Click Create bucket
# 6. Open the bucket → Permissions tab → Bucket Policy → Edit → paste this:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::aura-music-files-YOURNAME/*"
    }
  ]
}

# Replace YOURNAME with your actual bucket name → Save changes


# ───────────────────────────────────────────────────────────────
# STEP 2 — CREATE IAM USER FOR S3  (AWS Console)
# ───────────────────────────────────────────────────────────────

# 1. AWS Console → IAM → Users → Create user
# 2. Username: aura-s3-user → Next
# 3. Permissions: Attach policies directly → search AmazonS3FullAccess → check it → Next → Create user
# 4. Click the user → Security credentials tab → Create access key
# 5. Use case: Application running outside AWS → Next → Create access key
# 6. SAVE BOTH values right now — Secret is shown ONCE only:
#       Access Key ID     : AKIA...
#       Secret Access Key : xxxxxx...


# ───────────────────────────────────────────────────────────────
# STEP 3 — LAUNCH EC2 INSTANCE  (AWS Console)
# ───────────────────────────────────────────────────────────────

# 1. AWS Console → EC2 → Launch Instance
# 2. Name          : aura-music-server
#    AMI           : Amazon Linux 2023 AMI  ← important, select this one
#    Instance type : t2.micro (free tier) or t3.small (better)
# 3. Key pair → Create new key pair
#       Name     : aura-key
#       Type     : RSA
#       Format   : .pem
#    → Create and download the .pem file  ← keep this safe!
# 4. Network settings → Edit → Create security group
#    Add these inbound rules:
#       Type         Port   Source
#       SSH           22    My IP        ← only your IP
#       HTTP          80    0.0.0.0/0    ← everyone
#       Custom TCP   5000   0.0.0.0/0    ← for direct testing
# 5. Launch Instance
# 6. Go to Instances → copy the Public IPv4 address  ← you'll need this


# ───────────────────────────────────────────────────────────────
# STEP 4 — PUSH CODE TO GITHUB  (your local machine)
# ───────────────────────────────────────────────────────────────

# Open terminal on your local machine inside the aura-music folder:

cd aura-music
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/aura-music.git
git branch -M main
git push -u origin main


# ───────────────────────────────────────────────────────────────
# STEP 5 — SSH INTO EC2
# ───────────────────────────────────────────────────────────────

# In your terminal (where you downloaded aura-key.pem):
chmod 400 aura-key.pem
ssh -i aura-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# You are now inside your EC2 server


# ───────────────────────────────────────────────────────────────
# STEP 6 — INSTALL ALL SOFTWARE
# ───────────────────────────────────────────────────────────────

sudo dnf update -y

# Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node --version        # should show v20.x.x

# Git, Nginx
sudo dnf install -y git nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# PM2 (keeps app running)
sudo npm install -g pm2

# PostgreSQL 15
sudo dnf install -y postgresql15 postgresql15-server

# Initialize the database (only needed once)
sudo postgresql-setup --initdb
# Output: Initializing database ... OK

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
# Look for: Active: active (running)

# Create logs folder
mkdir -p /home/ec2-user/logs


# ───────────────────────────────────────────────────────────────
# STEP 7 — CREATE DATABASE AND USER
# ───────────────────────────────────────────────────────────────

# Switch to postgres user
sudo -i -u postgres

# Open database shell
psql

# Run these 4 commands inside psql (press Enter after each):
CREATE DATABASE aura_music;
CREATE USER aura_admin WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE aura_music TO aura_admin;
ALTER DATABASE aura_music OWNER TO aura_admin;

# Exit psql
\q

# Go back to ec2-user
exit


# ───────────────────────────────────────────────────────────────
# STEP 8 — ALLOW PASSWORD LOGIN FOR POSTGRESQL
# ───────────────────────────────────────────────────────────────

# Amazon Linux blocks password auth by default — we must enable it

sudo nano /var/lib/pgsql/data/pg_hba.conf

# Scroll to the bottom. Find these lines:
#   local   all   all                    peer
#   host    all   all   127.0.0.1/32     ident
#   host    all   all   ::1/128          ident

# Change every word "peer" and "ident" to "md5" so it looks like:
#   local   all   all                    md5
#   host    all   all   127.0.0.1/32     md5
#   host    all   all   ::1/128          md5

# Save and exit: Ctrl+O → Enter → Ctrl+X

# Restart PostgreSQL to apply
sudo systemctl restart postgresql

# Quick test:
psql -U aura_admin -d aura_music -h 127.0.0.1 -W -c "SELECT 1;"
# Enter your password: YourStrongPassword123!
# Should print: ?column? = 1   ← means it works!


# ───────────────────────────────────────────────────────────────
# STEP 9 — CLONE REPO AND INSTALL DEPENDENCIES
# ───────────────────────────────────────────────────────────────

cd /home/ec2-user
git clone https://github.com/YOUR_USERNAME/aura-music.git
cd aura-music/backend
npm install


# ───────────────────────────────────────────────────────────────
# STEP 10 — CREATE .env FILE
# ───────────────────────────────────────────────────────────────

cp .env.example .env
nano .env

# Fill in your actual values:
# ──────────────────────────────────────────
PORT=5000
NODE_ENV=production

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=aura_music
DB_USER=aura_admin
DB_PASSWORD=YourStrongPassword123!

JWT_SECRET=type_any_random_long_string_here_at_least_32_characters
JWT_EXPIRES_IN=7d

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_from_step_2
AWS_SECRET_ACCESS_KEY=your_secret_key_from_step_2
S3_BUCKET_NAME=aura-music-files-YOURNAME

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx

FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP
OTP_EXPIRES_MINUTES=10
# ──────────────────────────────────────────
# Save: Ctrl+O → Enter → Ctrl+X

# ── Gmail App Password (needed for OTP emails) ──────────────────
# 1. Go to myaccount.google.com
# 2. Security → 2-Step Verification → turn it ON if not already
# 3. Security → App passwords (scroll down, search "App passwords")
# 4. App name: type "AURA" → Create
# 5. Copy the 16-character password shown → paste as SMTP_PASS


# ───────────────────────────────────────────────────────────────
# STEP 11 — UPDATE FRONTEND API URL
# ───────────────────────────────────────────────────────────────

nano /home/ec2-user/aura-music/frontend/js/api.js

# Find this line:
#   BASE: 'http://YOUR_EC2_PUBLIC_IP/api',
# Replace YOUR_EC2_PUBLIC_IP with your actual IP, for example:
#   BASE: 'http://54.123.45.67/api',

# Save: Ctrl+O → Enter → Ctrl+X


# ───────────────────────────────────────────────────────────────
# STEP 12 — RUN DATABASE MIGRATION
# ───────────────────────────────────────────────────────────────

cd /home/ec2-user/aura-music/backend
node ../database/migrate.js

# Expected output:
# ✅ Schema applied successfully
# 👤 Admin login → Email: admin@aura.com  Password: Admin@123456
# ⚠️  Change the admin password after first login!

# If you see an error like "role does not exist":
#   → Redo Step 8 (pg_hba.conf), restart postgresql, retry


# ───────────────────────────────────────────────────────────────
# STEP 13 — START APP WITH PM2
# ───────────────────────────────────────────────────────────────

cd /home/ec2-user/aura-music/backend
cp ../deployment/ecosystem.config.js .
pm2 start ecosystem.config.js --env production

# Check it started correctly
pm2 status
# Should show:  aura-music | online

# See live logs (watch for any errors)
pm2 logs aura-music --lines 30

# Test the API is responding
curl http://localhost:5000/api/health
# Should return: {"status":"OK","app":"AURA Music",...}

# Save PM2 process list (survives reboots)
pm2 save

# Set PM2 to auto-start when EC2 reboots
pm2 startup
# IMPORTANT: Copy the command it prints and run it!
# It looks like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user


# ───────────────────────────────────────────────────────────────
# STEP 14 — CONFIGURE NGINX
# ───────────────────────────────────────────────────────────────

# Copy our Nginx config
# Note: Amazon Linux uses /etc/nginx/conf.d/ (not sites-available like Ubuntu)
sudo cp /home/ec2-user/aura-music/deployment/nginx.conf /etc/nginx/conf.d/aura-music.conf

# Remove the default server block so it doesn't conflict
sudo nano /etc/nginx/nginx.conf

# Inside this file find the server { } block that looks like:
#
#     server {
#         listen       80;
#         listen       [::]:80;
#         server_name  _;
#         root         /usr/share/nginx/html;
#         ...
#     }
#
# Put a # at the start of every single line inside that block to comment it out
# OR delete the entire server { } block
# Save: Ctrl+O → Enter → Ctrl+X

# Test Nginx config (must say "syntax is ok")
sudo nginx -t

# Apply the config
sudo systemctl reload nginx


# ───────────────────────────────────────────────────────────────
# STEP 15 — FIX SELINUX  ← Amazon Linux only, very important!
# ───────────────────────────────────────────────────────────────

# Amazon Linux has SELinux which by default BLOCKS Nginx from
# talking to your Node.js app. This causes 502 Bad Gateway.
# Fix it with one command:

sudo setsebool -P httpd_can_network_connect 1

# The -P flag makes this permanent (survives reboots)


# ───────────────────────────────────────────────────────────────
# STEP 16 — OPEN YOUR APP 🎉
# ───────────────────────────────────────────────────────────────

# Open your browser and go to:
http://YOUR_EC2_PUBLIC_IP

# What you should see:
# → AURA splash screen with animated gold logo
# → After ~3 seconds: landing page with spinning vinyl
# → Click "Get Started" → register with OTP email verification
# → Or click "Sign In"

# Default admin login:
# URL      : http://YOUR_EC2_PUBLIC_IP/login.html
# Email    : admin@aura.com
# Password : Admin@123456
# ⚠️  Change this password immediately in your profile!

# Admin can:
# → Upload songs (with thumbnail + artist photo)
# → Add new artists or pick existing ones
# → Delete songs and artists
# → Manage all content from Admin Panel

# Users can:
# → Register (OTP email verification on signup)
# → Login (no OTP needed — just email + password)
# → Browse songs, filter by artist
# → Play music with background audio player


# ───────────────────────────────────────────────────────────────
# UPDATING THE APP LATER
# ───────────────────────────────────────────────────────────────

# Whenever you push new code to GitHub:
ssh -i aura-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
cd /home/ec2-user/aura-music
git pull origin main
cd backend && npm install
pm2 reload aura-music


# ───────────────────────────────────────────────────────────────
# USEFUL COMMANDS
# ───────────────────────────────────────────────────────────────

pm2 status                          # check if app is running
pm2 logs aura-music                 # view app logs
pm2 restart aura-music              # restart app
pm2 monit                           # live CPU/memory monitor

sudo systemctl status postgresql    # check database
sudo systemctl restart postgresql   # restart database
sudo systemctl status nginx         # check nginx
sudo systemctl restart nginx        # restart nginx

sudo tail -f /var/log/nginx/error.log   # nginx error log


# ───────────────────────────────────────────────────────────────
# TROUBLESHOOTING
# ───────────────────────────────────────────────────────────────

# PROBLEM: 502 Bad Gateway when opening the site
# SOLUTION 1: Run → sudo setsebool -P httpd_can_network_connect 1
# SOLUTION 2: Check app is running → pm2 status
# SOLUTION 3: sudo nginx -t  (check for config errors)

# PROBLEM: "peer authentication failed" during migration
# SOLUTION: Re-do Step 8 — make sure pg_hba.conf has "md5" not "peer" or "ident"
#           Then: sudo systemctl restart postgresql

# PROBLEM: migrate.js fails with "ECONNREFUSED 127.0.0.1:5432"
# SOLUTION: PostgreSQL is not running → sudo systemctl start postgresql

# PROBLEM: OTP email not arriving
# SOLUTION: Check your Gmail App Password is correct (not regular password)
#           Must have 2-Step Verification ON → then App Passwords
#           Check spam folder

# PROBLEM: S3 upload fails
# SOLUTION: Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME in .env
#           Make sure bucket policy allows public read (Step 1)

# PROBLEM: App not starting after EC2 reboot
# SOLUTION: Did you run "pm2 startup" and run the command it printed?
#           Check: sudo systemctl status pm2-ec2-user