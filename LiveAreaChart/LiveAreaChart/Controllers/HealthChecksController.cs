using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
using Microsoft.AspNetCore.Mvc;

namespace LiveAreaChartExample.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthChecksController : ControllerBase
    {
        private static readonly Random Random = new Random();
        private static ConcurrentBag<HealthCheckViewModel> _todayHealthCheckHistory = new ConcurrentBag<HealthCheckViewModel>();

        static HealthChecksController()
        {
            //Imitate background healthcheck collection
            new Thread(_ =>
            {
                while(true)
                {
                    //Self-cleanup for demo deployment
                    if (_todayHealthCheckHistory.Count > 1800) 
                    { 
                        for (var i = 0; i < 6; i++) { _todayHealthCheckHistory.TryTake(out var whatever); }
                    }

                    var now = DateTime.Now;

                    var healthchecks = new List<HealthCheckViewModel>
                    {
                        new HealthCheckViewModel
                        {
                            Name = "Database",
                            ApplicationName = "MyApplication #1",
                            MachineName = "machine01",
                            CheckTime = now,
                            Success = Random.NextDouble() > 0.2,
                        },
                        new HealthCheckViewModel
                        {
                            Name = "Queue",
                            ApplicationName = "MyApplication #1",
                            MachineName = "machine01",
                            CheckTime = now,
                            Success = Random.NextDouble() > 0.2,
                        },
                        new HealthCheckViewModel
                        {
                            Name = "Other service",
                            ApplicationName = "MyApplication #1",
                            MachineName = "machine01",
                            CheckTime = now,
                            Success = Random.NextDouble() > 0.2,
                        },
                        new HealthCheckViewModel
                        {
                            Name = "Database",
                            ApplicationName = "MyApplication #1",
                            MachineName = "machine02",
                            CheckTime = now,
                            Success = Random.NextDouble() > 0.2,
                        },
                        new HealthCheckViewModel
                        {
                            Name = "Queue",
                            ApplicationName = "MyApplication #1",
                            MachineName = "machine02",
                            CheckTime = now,
                            Success = Random.NextDouble() > 0.2,
                        },
                        new HealthCheckViewModel
                        {
                            Name = "Other service",
                            ApplicationName = "MyApplication #1",
                            MachineName = "machine02",
                            CheckTime = now,
                            Success = Random.NextDouble() > 0.2,
                        }
                    };

                    foreach (var healthCheck in healthchecks)
                    {
                        _todayHealthCheckHistory.Add(healthCheck);
                    }
                    Thread.Sleep(500);
                }
            }).Start();
        }

        [HttpGet("get-latest")]
        public List<HealthCheckViewModel> GetLatestData()
        {
#if DEBUG
            var now = DateTime.Now;

            var healthchecks = new List<HealthCheckViewModel>
            {
                new HealthCheckViewModel
                {
                    Name = "Database",
                    ApplicationName = "MyApplication #1",
                    MachineName = "machine01",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                },
                new HealthCheckViewModel
                {
                    Name = "Queue",
                    ApplicationName = "MyApplication #1",
                    MachineName = "machine01",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                },
                new HealthCheckViewModel
                {
                    Name = "Other service",
                    ApplicationName = "MyApplication #1",
                    MachineName = "machine01",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                },
                new HealthCheckViewModel
                {
                    Name = "Database",
                    ApplicationName = "MyApplication #1",
                    MachineName = "machine02",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                },
                new HealthCheckViewModel
                {
                    Name = "Queue",
                    ApplicationName = "MyApplication #1",
                    MachineName = "machine02",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                },
                new HealthCheckViewModel
                {
                    Name = "Other service",
                    ApplicationName = "MyApplication #1",
                    MachineName = "machine02",
                    CheckTime = now,
                    Success = Random.NextDouble() > 0.2,
                }
            };

            while (healthchecks.Count < 1800)
            {
                now = now.AddSeconds(1);
                healthchecks.AddRange(new[]
                {
                    new HealthCheckViewModel
                    {
                        Name = "Database",
                        ApplicationName = "MyApplication #1",
                        MachineName = "machine01",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    },
                    new HealthCheckViewModel
                    {
                        Name = "Queue",
                        ApplicationName = "MyApplication #1",
                        MachineName = "machine01",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    },
                    new HealthCheckViewModel
                    {
                        Name = "Other service",
                        ApplicationName = "MyApplication #1",
                        MachineName = "machine01",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    },
                    new HealthCheckViewModel
                    {
                        Name = "Database",
                        ApplicationName = "MyApplication #1",
                        MachineName = "machine02",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    },
                    new HealthCheckViewModel
                    {
                        Name = "Queue",
                        ApplicationName = "MyApplication #1",
                        MachineName = "machine02",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    },
                    new HealthCheckViewModel
                    {
                        Name = "Other service",
                        ApplicationName = "MyApplication #1",
                        MachineName = "machine02",
                        CheckTime = now,
                        Success = Random.NextDouble() > 0.2,
                    }
                });
            }

            return healthchecks;
#endif

            return new List<HealthCheckViewModel>(_todayHealthCheckHistory);
        }
    }

    public class HealthCheckViewModel
    {
        public string ApplicationName { get; set; }
        public string MachineName { get; set; }
        public string Name { get; set; }
        public DateTime CheckTime { get; set; }
        public bool Success { get; set; }
    }
}
