import { Client } from '@elastic/elasticsearch';
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  public client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ES_NODE as string,
      auth: {
        apiKey: process.env.ES_API_KEY as string,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      console.log('✅ Elasticsearch connected!');
    } catch (err) {
      console.error('❌ Elasticsearch connection error:', err);
      process.exit(1);
    }
  }
}
