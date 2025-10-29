#!/usr/bin/env python3
"""
AgentHub Cost Calculator for On-Demand Usage
Calculate exact costs for your usage pattern
"""

def calculate_costs(minutes_per_day, days_per_month=30):
    """Calculate monthly costs for on-demand usage"""
    
    # AWS Pricing (us-east-1)
    EC2_HOURLY = 0.0104  # t3.micro per hour
    EBS_MONTHLY = 0.10   # per GB per month
    DATA_TRANSFER = 0.09 # per GB
    
    # Calculate usage
    hours_per_day = minutes_per_day / 60
    hours_per_month = hours_per_day * days_per_month
    
    # Calculate costs
    ec2_cost = hours_per_month * EC2_HOURLY
    ebs_cost = 20 * EBS_MONTHLY  # 20GB storage
    data_cost = 1 * DATA_TRANSFER  # 1GB transfer estimate
    
    total_monthly = ec2_cost + ebs_cost + data_cost
    
    return {
        'hours_per_month': hours_per_month,
        'ec2_compute': ec2_cost,
        'ebs_storage': ebs_cost,
        'data_transfer': data_cost,
        'total_monthly': total_monthly,
        'total_yearly': total_monthly * 12
    }

def print_cost_analysis():
    """Print cost analysis for different usage patterns"""
    
    usage_patterns = [
        (30, "Your usage (30 min/day)"),
        (60, "Extended usage (1 hour/day)"),
        (120, "Heavy usage (2 hours/day)"),
        (1440, "Always-on (24 hours/day)")
    ]
    
    print("💰 AgentHub Cost Analysis")
    print("=" * 50)
    
    for minutes, description in usage_patterns:
        costs = calculate_costs(minutes)
        
        print(f"\n📊 {description}")
        print(f"   Hours/month: {costs['hours_per_month']:.1f}")
        print(f"   EC2 compute: ${costs['ec2_compute']:.2f}")
        print(f"   EBS storage: ${costs['ebs_storage']:.2f}")
        print(f"   Data transfer: ${costs['data_transfer']:.2f}")
        print(f"   Total/month: ${costs['total_monthly']:.2f}")
        print(f"   Total/year: ${costs['total_yearly']:.2f}")
    
    # Calculate how long $100 credits last
    print("\n🎯 $100 Credit Duration:")
    print("=" * 30)
    
    for minutes, description in usage_patterns:
        costs = calculate_costs(minutes)
        months_with_100 = 100 / costs['total_monthly']
        print(f"{description}: {months_with_100:.1f} months")

if __name__ == "__main__":
    print_cost_analysis()
    
    # Your specific calculation
    your_costs = calculate_costs(30)  # 30 minutes per day
    
    print(f"\n🎉 Your Optimized Setup:")
    print(f"   Monthly cost: ${your_costs['total_monthly']:.2f}")
    print(f"   $100 credits last: {100/your_costs['total_monthly']:.0f} months!")
    print(f"   Daily cost: ${your_costs['total_monthly']/30:.3f}")
    print(f"   Cost per session: ${your_costs['total_monthly']/30:.3f}")