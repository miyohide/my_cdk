import * as cdk from 'aws-cdk-lib';
import { Instance, InstanceClass, InstanceSize, InstanceType, MachineImage, SubnetType, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MyEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPCの作成
    const vpc = new Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1, // プライベートサブネットからのアウトバウンドアクセス用
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // EC2インスタンス用のIAMロール作成
    const ec2Role = new Role(this, 'MyEC2Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Javaインストール用のUserDataスクリプト
    const userData = UserData.forLinux();
    userData.addCommands(
      // システムアップデート
      'dnf update -y',

      // Amazon Corretto 21 (OpenJDK)をインストール
      'dnf install -y java-21-amazon-corretto java-21-amazon-corretto-devel',

      // JAVA_HOME環境変数の設定
      'echo "export JAVA_HOME=/usr/lib/jvm/java-21-amazon-corretto" >> /etc/environment',
      'echo "export PATH=$JAVA_HOME/bin:$PATH" >> /etc/environment',

      // 現在のセッション用にも環境変数を設定
      'export JAVA_HOME=/usr/lib/jvm/java-21-amazon-corretto',
      'export PATH=$JAVA_HOME/bin:$PATH',
    );

    // EC2インスタンスの作成
    const instance = new Instance(this, 'JavaEc2Instance', {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux2023(),
      userData,
      role: ec2Role,
    });

    // タグの追加
    cdk.Tags.of(instance).add('Name', 'Java-EC2-Instance');
    cdk.Tags.of(instance).add('Environment', 'Development');
    cdk.Tags.of(instance).add('Application', 'Java-Application');
  }
}
