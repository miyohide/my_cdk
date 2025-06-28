import * as cdk from 'aws-cdk-lib';
import { IpAddresses, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class MyVpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Vpc(this, 'SampleVpc', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      vpcName: 'cdk-sample-vpc'
    });
  }
}
